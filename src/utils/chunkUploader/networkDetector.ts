import { NetworkStatus } from './types'
import { HEARTBEAT_INTERVAL } from './constants'

type NetworkStatusCallback = (status: NetworkStatus) => void

class NetworkDetector {
  private listeners: Set<NetworkStatusCallback> = new Set()
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private lastKnownOnline: boolean = navigator.onLine

  start(): void {
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)

    this.heartbeatTimer = setInterval(() => {
      this.checkConnection()
    }, HEARTBEAT_INTERVAL)
  }

  stop(): void {
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private handleOnline = (): void => {
    this.emitStatus(true)
  }

  private handleOffline = (): void => {
    this.emitStatus(false)
  }

  private async checkConnection(): Promise<void> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      this.emitStatus(true)
    } catch {
      this.emitStatus(false)
    }
  }

  private emitStatus(online: boolean): void {
    if (this.lastKnownOnline === online) return
    this.lastKnownOnline = online

    const status: NetworkStatus = {
      online,
      effectiveType: (navigator as any).connection?.effectiveType,
      downlink: (navigator as any).connection?.downlink
    }

    this.listeners.forEach((callback) => callback(status))
  }

  isOnline(): boolean {
    return navigator.onLine
  }

  subscribe(callback: NetworkStatusCallback): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  getConnectionInfo(): NetworkStatus {
    return {
      online: navigator.onLine,
      effectiveType: (navigator as any).connection?.effectiveType,
      downlink: (navigator as any).connection?.downlink
    }
  }
}

export const networkDetector = new NetworkDetector()
