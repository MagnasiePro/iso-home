/** The slice of Home Assistant's frontend `hass` object this card uses. */
export interface HassEntity {
  state: string;
  attributes: Record<string, unknown>;
}

export interface HassConnection {
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

export interface Hass {
  states: Record<string, HassEntity | undefined>;
  callService(domain: string, service: string, data?: Record<string, unknown>): Promise<unknown>;
  connection?: HassConnection;
}
