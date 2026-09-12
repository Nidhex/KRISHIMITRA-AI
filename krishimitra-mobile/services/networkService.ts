/* ==========================================================================
   KrishiMitra AI — Mobile Network Service
   Monitors device connectivity & Render backend reachability separately.
   ========================================================================== */

import { apiClient } from './apiClient';

export type NetworkStatusType = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'UNKNOWN';

export interface NetworkState {
  isDeviceConnected: boolean;
  isBackendReachable: boolean;
  status: NetworkStatusType;
  lastCheckedAt: string;
}

class MobileNetworkService {
  private currentState: NetworkState = {
    isDeviceConnected: true,
    isBackendReachable: true,
    status: 'UNKNOWN',
    lastCheckedAt: new Date().toISOString(),
  };

  private listeners: Set<(state: NetworkState) => void> = new Set();

  constructor() {
    this.checkReachability();
  }

  /**
   * Ping backend to verify true online reachability.
   */
  async checkReachability(): Promise<NetworkState> {
    try {
      const health = await apiClient.checkHealth();
      const isReachable = health.success && health.data?.status === 'running';

      this.currentState = {
        isDeviceConnected: true,
        isBackendReachable: isReachable,
        status: isReachable ? 'ONLINE' : 'DEGRADED',
        lastCheckedAt: new Date().toISOString(),
      };
    } catch (e) {
      this.currentState = {
        isDeviceConnected: false,
        isBackendReachable: false,
        status: 'OFFLINE',
        lastCheckedAt: new Date().toISOString(),
      };
    }

    this.notifyListeners();
    return this.currentState;
  }

  getState(): NetworkState {
    return { ...this.currentState };
  }

  subscribe(listener: (state: NetworkState) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.currentState));
  }
}

export const networkService = new MobileNetworkService();
