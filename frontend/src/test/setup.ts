import '@testing-library/jest-dom'

import { vi } from 'vitest'

// Mock WebSocket for testing
global.WebSocket = class WebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = WebSocket.CONNECTING
  
  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      this.onopen?.({ target: this } as any)
    }, 0)
  }

  send = vi.fn()
  close = vi.fn(() => {
    this.readyState = WebSocket.CLOSED
    this.onclose?.({ target: this } as any)
  })
  
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
}

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'localhost',
    port: '3000',
    protocol: 'http:',
    host: 'localhost:3000'
  },
  writable: true
})