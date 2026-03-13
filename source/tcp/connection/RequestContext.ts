import { Socket } from 'net';
import { TCPRequest } from '../types/protocol.types';

/**
 * Request Context - Wraps request information for handlers
 * Provides a unified interface similar to HTTP request/response
 */
export class RequestContext {
  public readonly request: TCPRequest;
  public readonly socket: Socket;
  public readonly remoteAddress: string;
  public readonly timestamp: number;

  constructor(request: TCPRequest, socket: Socket) {
    this.request = request;
    this.socket = socket;
    this.remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
    this.timestamp = Date.now();
  }

  /**
   * Get request ID (correlation ID)
   */
  get id(): string {
    return this.request.id;
  }

  /**
   * Get command type
   */
  get command(): string {
    return this.request.command;
  }

  /**
   * Get request parameters
   */
  get params(): any {
    return this.request.params;
  }

  /**
   * Check if connection is still alive
   */
  get isAlive(): boolean {
    return !this.socket.destroyed && this.socket.writable;
  }

  /**
   * Get connection metadata
   */
  getMetadata(): Record<string, any> {
    return {
      remoteAddress: this.remoteAddress,
      timestamp: this.timestamp,
      requestId: this.id,
      command: this.command,
    };
  }
}
