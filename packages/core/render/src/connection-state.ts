export type ConnectionStatus = "connected" | "reconnecting";

/**
 * Platform-agnostic connection status (FR-017, data-model.md). Adapters map
 * their own lifecycle (HA websocket, `hass` updates) onto `setStatus`; core
 * never imports Home Assistant.
 */
export class ConnectionState {
  private current: ConnectionStatus = "connected";
  private readonly listeners = new Set<(status: ConnectionStatus) => void>();

  get status(): ConnectionStatus {
    return this.current;
  }

  setStatus(status: ConnectionStatus): void {
    if (status === this.current) return;
    this.current = status;
    for (const listener of this.listeners) listener(status);
  }

  /** Returns an unsubscribe function. */
  subscribe(listener: (status: ConnectionStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
