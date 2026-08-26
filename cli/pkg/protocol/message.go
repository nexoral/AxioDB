package protocol

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"

	"github.com/google/uuid"
)

const MaxMessageSize = 50 * 1024 * 1024

type Request struct {
	ID      string                 `json:"id"`
	Command string                 `json:"command"`
	Params  map[string]interface{} `json:"params"`
}

type Response struct {
	ID         string      `json:"id"`
	StatusCode int         `json:"statusCode"`
	Message    string      `json:"message"`
	Data       interface{} `json:"data,omitempty"`
	Error      string      `json:"error,omitempty"`
}

func NewRequest(command string, params map[string]interface{}) *Request {
	return &Request{
		ID:      uuid.New().String(),
		Command: command,
		Params:  params,
	}
}

func Encode(msg interface{}) ([]byte, error) {
	payload, err := json.Marshal(msg)
	if err != nil {
		return nil, fmt.Errorf("json marshal: %w", err)
	}

	if len(payload) > MaxMessageSize {
		return nil, fmt.Errorf("message size %d exceeds max %d", len(payload), MaxMessageSize)
	}

	frame := make([]byte, 4+len(payload))
	binary.BigEndian.PutUint32(frame[:4], uint32(len(payload)))
	copy(frame[4:], payload)

	return frame, nil
}

func Decode(reader io.Reader) (*Response, error) {
	lengthBytes := make([]byte, 4)
	if _, err := io.ReadFull(reader, lengthBytes); err != nil {
		return nil, fmt.Errorf("read length: %w", err)
	}

	length := binary.BigEndian.Uint32(lengthBytes)
	if length > MaxMessageSize {
		return nil, fmt.Errorf("message size %d exceeds max %d", length, MaxMessageSize)
	}

	payload := make([]byte, length)
	if _, err := io.ReadFull(reader, payload); err != nil {
		return nil, fmt.Errorf("read payload: %w", err)
	}

	var resp Response
	if err := json.Unmarshal(payload, &resp); err != nil {
		return nil, fmt.Errorf("json unmarshal: %w", err)
	}

	return &resp, nil
}
