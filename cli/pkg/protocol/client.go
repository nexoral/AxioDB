package protocol

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"net"
	"os"
	"sync"
	"time"
)

type ClientConfig struct {
	Host           string
	Port           int
	TLSEnabled     bool
	TLSCertPath    string
	TLSSkipVerify  bool
	Timeout        time.Duration
}

type pendingRequest struct {
	ch chan *Response
}

type Client struct {
	config   ClientConfig
	conn     net.Conn
	pending  map[string]*pendingRequest
	mu       sync.Mutex
	done     chan struct{}
	closed   bool
}

func NewClient(cfg ClientConfig) *Client {
	if cfg.Timeout == 0 {
		cfg.Timeout = 30 * time.Second
	}
	return &Client{
		config:  cfg,
		pending: make(map[string]*pendingRequest),
		done:    make(chan struct{}),
	}
}

func (c *Client) Connect() error {
	addr := fmt.Sprintf("%s:%d", c.config.Host, c.config.Port)

	if c.config.TLSEnabled {
		tlsCfg := &tls.Config{
			InsecureSkipVerify: c.config.TLSSkipVerify,
		}

		if c.config.TLSCertPath != "" {
			cert, err := os.ReadFile(c.config.TLSCertPath)
			if err != nil {
				return fmt.Errorf("read TLS cert: %w", err)
			}
			pool := x509.NewCertPool()
			if !pool.AppendCertsFromPEM(cert) {
				return fmt.Errorf("failed to parse TLS certificate")
			}
			tlsCfg.RootCAs = pool
		}

		conn, err := tls.Dial("tcp", addr, tlsCfg)
		if err != nil {
			return fmt.Errorf("TLS connect: %w", err)
		}
		c.conn = conn
	} else {
		conn, err := net.DialTimeout("tcp", addr, c.config.Timeout)
		if err != nil {
			return fmt.Errorf("TCP connect: %w", err)
		}
		c.conn = conn
	}

	go c.readLoop()
	return nil
}

func (c *Client) Send(command string, params map[string]interface{}) (*Response, error) {
	req := NewRequest(command, params)

	ch := make(chan *Response, 1)
	c.mu.Lock()
	c.pending[req.ID] = &pendingRequest{ch: ch}
	c.mu.Unlock()

	defer func() {
		c.mu.Lock()
		delete(c.pending, req.ID)
		c.mu.Unlock()
	}()

	data, err := Encode(req)
	if err != nil {
		return nil, fmt.Errorf("encode request: %w", err)
	}

	if err := c.conn.SetWriteDeadline(time.Now().Add(c.config.Timeout)); err != nil {
		return nil, fmt.Errorf("set write deadline: %w", err)
	}

	if _, err := c.conn.Write(data); err != nil {
		return nil, fmt.Errorf("write request: %w", err)
	}

	select {
	case resp := <-ch:
		return resp, nil
	case <-time.After(c.config.Timeout):
		return nil, fmt.Errorf("request timeout after %s", c.config.Timeout)
	case <-c.done:
		return nil, fmt.Errorf("connection closed")
	}
}

func (c *Client) Disconnect() error {
	c.mu.Lock()
	if c.closed {
		c.mu.Unlock()
		return nil
	}
	c.closed = true
	c.mu.Unlock()

	_, _ = c.Send("DISCONNECT", nil)

	close(c.done)
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}

func (c *Client) Ping() error {
	resp, err := c.Send("PING", nil)
	if err != nil {
		return err
	}
	if resp.StatusCode != 200 {
		return fmt.Errorf("ping failed: %s", resp.Error)
	}
	return nil
}

func (c *Client) readLoop() {
	for {
		select {
		case <-c.done:
			return
		default:
		}

		resp, err := Decode(c.conn)
		if err != nil {
			c.mu.Lock()
			for id, p := range c.pending {
				p.ch <- &Response{StatusCode: 500, Error: fmt.Sprintf("connection error: %v", err)}
				delete(c.pending, id)
			}
			c.mu.Unlock()
			return
		}

		c.mu.Lock()
		if p, ok := c.pending[resp.ID]; ok {
			p.ch <- resp
		}
		c.mu.Unlock()
	}
}
