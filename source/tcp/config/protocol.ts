import { TCPRequest, TCPResponse } from '../types/protocol.types';
import { CommandType, CommandDocumentation } from '../types/command.types';
import { MAX_MESSAGE_SIZE, MESSAGE_LENGTH_BYTES, ENCODING, ErrorMessage, StatusCode } from './keys';

/**
 * Message Framing - Handles encoding/decoding of TCP messages
 * Protocol: [4-byte length (uint32 BE)][JSON payload]
 */
export class MessageFramer {
  /**
   * Encode message to binary format: [length][JSON]
   */
  static encode(message: TCPRequest | TCPResponse): Buffer {
    const json = JSON.stringify(message);
    const jsonBuffer = Buffer.from(json, ENCODING);

    if (jsonBuffer.length > MAX_MESSAGE_SIZE) {
      throw new Error(ErrorMessage.MESSAGE_TOO_LARGE);
    }

    const lengthBuffer = Buffer.allocUnsafe(MESSAGE_LENGTH_BYTES);
    lengthBuffer.writeUInt32BE(jsonBuffer.length, 0);

    return Buffer.concat([lengthBuffer, jsonBuffer]);
  }

  /**
   * Decode buffer to message object
   * Note: Caller must ensure buffer has complete message
   */
  static decode(buffer: Buffer): TCPRequest | TCPResponse {
    if (buffer.length < MESSAGE_LENGTH_BYTES) {
      throw new Error(ErrorMessage.INVALID_MESSAGE_FORMAT);
    }

    const length = buffer.readUInt32BE(0);

    if (length > MAX_MESSAGE_SIZE) {
      throw new Error(ErrorMessage.MESSAGE_TOO_LARGE);
    }

    if (buffer.length < MESSAGE_LENGTH_BYTES + length) {
      throw new Error(ErrorMessage.INVALID_MESSAGE_FORMAT);
    }

    const jsonBuffer = buffer.slice(MESSAGE_LENGTH_BYTES, MESSAGE_LENGTH_BYTES + length);
    const json = jsonBuffer.toString(ENCODING);

    try {
      return JSON.parse(json);
    } catch (error) {
      throw new Error(ErrorMessage.INVALID_MESSAGE_FORMAT);
    }
  }
}

/**
 * Message Buffer - Accumulates incoming data and extracts complete messages
 */
export class MessageBuffer {
  private buffer: Buffer = Buffer.alloc(0);

  /**
   * Add chunk to buffer and extract complete messages
   */
  addChunk(chunk: Buffer): (TCPRequest | TCPResponse)[] {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    const messages: (TCPRequest | TCPResponse)[] = [];

    while (this.buffer.length >= MESSAGE_LENGTH_BYTES) {
      const length = this.buffer.readUInt32BE(0);

      // Detect if we're receiving HTTP data instead of binary protocol
      if (this.buffer.length >= 4) {
        const firstBytes = this.buffer.toString('utf8', 0, 4);
        if (firstBytes.match(/^(HTTP|GET |POST|PUT |DELE|HEAD|OPTI)/)) {
          this.buffer = Buffer.alloc(0);
          throw new Error('Invalid protocol: Received HTTP data on TCP port. Check connection string.');
        }
      }

      if (length > MAX_MESSAGE_SIZE) {
        this.buffer = Buffer.alloc(0);
        throw new Error(ErrorMessage.MESSAGE_TOO_LARGE);
      }

      if (this.buffer.length < MESSAGE_LENGTH_BYTES + length) {
        break; // Wait for more data
      }

      const messageBuffer = this.buffer.slice(0, MESSAGE_LENGTH_BYTES + length);
      const message = MessageFramer.decode(messageBuffer);
      messages.push(message);

      this.buffer = this.buffer.slice(MESSAGE_LENGTH_BYTES + length);
    }

    return messages;
  }

  /**
   * Clear buffer (useful for error recovery)
   */
  clear(): void {
    this.buffer = Buffer.alloc(0);
  }

  /**
   * Get current buffer size
   */
  get size(): number {
    return this.buffer.length;
  }
}

/**
 * Message Validator - Validates request structure and parameters
 */
export class MessageValidator {
  /**
   * Validate TCPRequest structure
   */
  static validateRequest(request: any): TCPRequest {
    if (!request || typeof request !== 'object') {
      throw new Error(ErrorMessage.INVALID_MESSAGE_FORMAT);
    }

    if (!request.id || typeof request.id !== 'string') {
      throw new Error(ErrorMessage.INVALID_CORRELATION_ID);
    }

    if (!request.command || !Object.values(CommandType).includes(request.command)) {
      throw new Error(ErrorMessage.UNKNOWN_COMMAND);
    }

    if (!request.params || typeof request.params !== 'object') {
      request.params = {};
    }

    return request as TCPRequest;
  }

  /**
   * Validate command-specific parameters
   */
  static validateParams(command: CommandType, params: any): void {
    switch (command) {
      case CommandType.CREATE_DB:
      case CommandType.DELETE_DB:
      case CommandType.DB_EXISTS:
        if (!params.dbName) {
          throw new Error(`${ErrorMessage.MISSING_REQUIRED_PARAMS}: dbName`);
        }
        break;

      case CommandType.CREATE_COLLECTION:
      case CommandType.DELETE_COLLECTION:
      case CommandType.COLLECTION_EXISTS:
      case CommandType.GET_COLLECTION_INFO:
        if (!params.dbName || !params.collectionName) {
          throw new Error(`${ErrorMessage.MISSING_REQUIRED_PARAMS}: dbName, collectionName`);
        }
        break;

      case CommandType.INSERT_DOCUMENT:
        if (!params.dbName || !params.collectionName || !params.data) {
          throw new Error(`${ErrorMessage.MISSING_REQUIRED_PARAMS}: dbName, collectionName, data`);
        }
        break;

      case CommandType.INSERT_MANY_DOCUMENTS:
        if (!params.dbName || !params.collectionName || !params.documents) {
          throw new Error(`${ErrorMessage.MISSING_REQUIRED_PARAMS}: dbName, collectionName, documents`);
        }
        break;

      case CommandType.QUERY_DOCUMENTS:
        if (!params.dbName || !params.collectionName) {
          throw new Error(`${ErrorMessage.MISSING_REQUIRED_PARAMS}: dbName, collectionName`);
        }
        break;

      case CommandType.QUERY_BY_ID:
      case CommandType.UPDATE_DOCUMENT_BY_ID:
      case CommandType.DELETE_DOCUMENT_BY_ID:
        if (!params.dbName || !params.collectionName || !params.id) {
          throw new Error(`${ErrorMessage.MISSING_REQUIRED_PARAMS}: dbName, collectionName, id`);
        }
        break;

      case CommandType.UPDATE_DOCUMENTS_BY_QUERY:
        if (!params.dbName || !params.collectionName || !params.query || !params.updateData) {
          throw new Error(`${ErrorMessage.MISSING_REQUIRED_PARAMS}: dbName, collectionName, query, updateData`);
        }
        break;

      case CommandType.DELETE_DOCUMENTS_BY_QUERY:
        if (!params.dbName || !params.collectionName || !params.query) {
          throw new Error(`${ErrorMessage.MISSING_REQUIRED_PARAMS}: dbName, collectionName, query`);
        }
        break;

      case CommandType.AGGREGATE:
        if (!params.dbName || !params.collectionName || !params.pipeline) {
          throw new Error(`${ErrorMessage.MISSING_REQUIRED_PARAMS}: dbName, collectionName, pipeline`);
        }
        break;

      case CommandType.TOTAL_DOCUMENTS:
        if (!params.dbName || !params.collectionName) {
          throw new Error(`${ErrorMessage.MISSING_REQUIRED_PARAMS}: dbName, collectionName`);
        }
        break;

      case CommandType.CREATE_INDEX:
        if (!params.dbName || !params.collectionName || !params.fieldNames) {
          throw new Error(`${ErrorMessage.MISSING_REQUIRED_PARAMS}: dbName, collectionName, fieldNames`);
        }
        break;

      case CommandType.DROP_INDEX:
        if (!params.dbName || !params.collectionName || !params.indexName) {
          throw new Error(`${ErrorMessage.MISSING_REQUIRED_PARAMS}: dbName, collectionName, indexName`);
        }
        break;

      case CommandType.PING:
      case CommandType.DISCONNECT:
      case CommandType.GET_INSTANCE_INFO:
        // No required params
        break;

      default:
        throw new Error(ErrorMessage.UNKNOWN_COMMAND);
    }
  }

  /**
   * Create error response
   */
  static createErrorResponse(requestId: string, statusCode: number, message: string, error?: string): TCPResponse {
    return {
      id: requestId,
      statusCode,
      message,
      error,
    };
  }

  /**
   * Create success response
   */
  static createSuccessResponse(requestId: string, message: string, data?: any): TCPResponse {
    return {
      id: requestId,
      statusCode: StatusCode.OK,
      message,
      data,
    };
  }
}
