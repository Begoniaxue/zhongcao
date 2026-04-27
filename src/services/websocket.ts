export interface RealtimeData {
  timestamp: number
  value: number
  category: string
}

export interface AccumulatedData {
  [key: string]: number
}

export interface WebSocketMessage {
  type: 'realtime' | 'accumulated'
  data: RealtimeData | AccumulatedData
}

type DataCallback = (data: RealtimeData | AccumulatedData) => void
type ConnectionCallback = (status: 'connected' | 'disconnected' | 'error') => void

class WebSocketService {
  private ws: WebSocket | null = null
  private url: string = ''
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 1000
  private dataCallbacks: Set<DataCallback> = new Set()
  private connectionCallbacks: Set<ConnectionCallback> = new Set()
  private isPaused: boolean = false
  private pendingData: Array<RealtimeData | AccumulatedData> = []
  private useBinary: boolean = false

  constructor() {}

  connect(url: string, useBinary: boolean = false): void {
    this.url = url
    this.useBinary = useBinary
    this.reconnectAttempts = 0
    this.createConnection()
  }

  private createConnection(): void {
    try {
      this.ws = new WebSocket(this.url)
      if (this.useBinary) {
        this.ws.binaryType = 'arraybuffer'
      }

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        this.notifyConnectionStatus('connected')
      }

      this.ws.onmessage = (event: MessageEvent) => {
        this.handleMessage(event.data)
      }

      this.ws.onclose = () => {
        this.notifyConnectionStatus('disconnected')
        this.attemptReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.notifyConnectionStatus('error')
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      this.notifyConnectionStatus('error')
      this.attemptReconnect()
    }
  }

  private handleMessage(data: string | ArrayBuffer | Blob): void {
    let parsedData: RealtimeData | AccumulatedData

    try {
      if (data instanceof ArrayBuffer) {
        parsedData = this.parseBinaryData(data)
      } else if (data instanceof Blob) {
        const reader = new FileReader()
        reader.onload = () => {
          if (reader.result instanceof ArrayBuffer) {
            parsedData = this.parseBinaryData(reader.result)
            this.processData(parsedData)
          }
        }
        reader.readAsArrayBuffer(data)
        return
      } else {
        parsedData = this.parseJsonData(data)
      }

      this.processData(parsedData)
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  private parseJsonData(data: string): RealtimeData | AccumulatedData {
    const message: WebSocketMessage = JSON.parse(data)
    return message.data
  }

  private parseBinaryData(data: ArrayBuffer): RealtimeData | AccumulatedData {
    const view = new DataView(data)
    const typeByte = view.getUint8(0)

    if (typeByte === 1) {
      const timestamp = view.getFloat64(1, true)
      const value = view.getFloat64(9, true)
      const categoryLength = view.getUint8(17)
      const categoryBytes = new Uint8Array(data, 18, categoryLength)
      const category = new TextDecoder().decode(categoryBytes)

      return { timestamp, value, category }
    } else {
      const count = view.getUint8(1)
      const accumulated: AccumulatedData = {}
      let offset = 2

      for (let i = 0; i < count; i++) {
        const keyLength = view.getUint8(offset)
        offset += 1
        const keyBytes = new Uint8Array(data, offset, keyLength)
        const key = new TextDecoder().decode(keyBytes)
        offset += keyLength
        const value = view.getFloat64(offset, true)
        offset += 8
        accumulated[key] = value
      }

      return accumulated
    }
  }

  private processData(data: RealtimeData | AccumulatedData): void {
    if (this.isPaused) {
      this.pendingData.push(data)
    } else {
      this.notifyDataCallbacks(data)
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * this.reconnectAttempts
      console.log(`Attempting to reconnect in ${delay}ms... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

      setTimeout(() => {
        this.createConnection()
      }, delay)
    } else {
      console.error('Max reconnect attempts reached. Please check your connection.')
    }
  }

  subscribeToData(callback: DataCallback): () => void {
    this.dataCallbacks.add(callback)
    return () => {
      this.dataCallbacks.delete(callback)
    }
  }

  subscribeToConnection(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback)
    return () => {
      this.connectionCallbacks.delete(callback)
    }
  }

  private notifyDataCallbacks(data: RealtimeData | AccumulatedData): void {
    this.dataCallbacks.forEach((callback) => {
      try {
        callback(data)
      } catch (error) {
        console.error('Data callback error:', error)
      }
    })
  }

  private notifyConnectionStatus(status: 'connected' | 'disconnected' | 'error'): void {
    this.connectionCallbacks.forEach((callback) => {
      try {
        callback(status)
      } catch (error) {
        console.error('Connection callback error:', error)
      }
    })
  }

  pause(): void {
    this.isPaused = true
  }

  resume(): void {
    this.isPaused = false
    const pending = [...this.pendingData]
    this.pendingData = []
    pending.forEach((data) => {
      this.notifyDataCallbacks(data)
    })
  }

  isPausedState(): boolean {
    return this.isPaused
  }

  getConnectionStatus(): WebSocket['readyState'] {
    return this.ws?.readyState ?? WebSocket.CLOSED
  }

  disconnect(): void {
    this.isPaused = false
    this.pendingData = []
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

export const websocketService = new WebSocketService()
