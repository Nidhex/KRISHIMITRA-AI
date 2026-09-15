/* ==========================================================================
   KrishiMitra AI — Mobile Network Service
   Monitors device connectivity (NetInfo) & Render backend reachability separately.
   Supports Expo Native runtime and Node CLI test execution gracefully.
   ========================================================================== */

import { apiClient, HealthCheckResult } from './apiClient';

export type NetworkStatusType = 'CHECKING' | 'ONLINE' | 'OFFLINE';

export interface NetworkState {
  isDeviceConnected: boolean;
  isBackendReachable: boolean;
  status: NetworkStatusType;
  lastCheckedAt: string;
  latencyMs?: number;
}

let NetInfo: any = null;
let AppState: any = null;

try {
  NetInfo = require('@react-native-community/netinfo');
  if (NetInfo.default) NetInfo = NetInfo.default;
} catch (e) {
  // NetInfo not available in Node CLI environment
}

try {
  const RN = require('react-native');
  AppState = RN ? RN.AppState : null;
} catch (e) {
  // AppState not available in Node CLI environment
}

class MobileNetworkService {
  private currentState: NetworkState = {
    isDeviceConnected: true,
    isBackendReachable: true,
    status: 'CHECKING',
    lastCheckedAt: new Date().toISOString(),
  };

  private listeners: Set<(state: NetworkState) => void> = new Set();
  private netInfoUnsubscribe: (() => void) | null = null;
  private appStateSubscription: any = null;

  constructor() {
    this.init();
  }

  private init() {
    // 1. Initial NetInfo fetch & listener setup
    if (NetInfo && typeof NetInfo.fetch === 'function') {
      NetInfo.fetch().then((state: any) => this.handleNetInfoChange(state)).catch(() => {});
      if (typeof NetInfo.addEventListener === 'function') {
        this.netInfoUnsubscribe = NetInfo.addEventListener((state: any) => this.handleNetInfoChange(state));
      }
    }

    // 2. Refresh network state when app comes from background to foreground
    if (AppState && typeof AppState.addEventListener === 'function') {
      this.appStateSubscription = AppState.addEventListener('change', (nextAppState: string) => {
        if (nextAppState === 'active') {
          this.refreshNetworkState();
        }
      });
    }

    // 3. Perform initial backend health check
    this.checkReachability();
  }

  private handleNetInfoChange(netInfoState: any) {
    // Rule: Treat device as disconnected ONLY if isConnected is explicitly false.
    // Rule: If reachability or connection status is unknown/null (e.g. startup probe), treat device as connected.
    const isDisconnected = netInfoState?.isConnected === false;

    if (isDisconnected) {
      this.currentState = {
        isDeviceConnected: false,
        isBackendReachable: false,
        status: 'OFFLINE',
        lastCheckedAt: new Date().toISOString(),
      };
      this.notifyListeners();
    } else {
      this.currentState = {
        ...this.currentState,
        isDeviceConnected: true,
        status: 'ONLINE',
        lastCheckedAt: new Date().toISOString(),
      };
      this.notifyListeners();
      // Re-check backend health asynchronously when device is connected
      this.checkReachability();
    }
  }

  /**
   * Ping backend to verify true online reachability.
   */
  async checkReachability(): Promise<NetworkState> {
    try {
      const health: HealthCheckResult = await apiClient.checkBackendHealth();

      this.currentState = {
        isDeviceConnected: this.currentState.isDeviceConnected,
        isBackendReachable: health.reachable,
        status: this.currentState.isDeviceConnected ? 'ONLINE' : 'OFFLINE',
        lastCheckedAt: new Date().toISOString(),
        latencyMs: health.latencyMs,
      };
    } catch (e) {
      // If check health throws, keep isDeviceConnected state if NetInfo says connected
      this.currentState = {
        ...this.currentState,
        isBackendReachable: false,
        status: this.currentState.isDeviceConnected ? 'ONLINE' : 'OFFLINE',
        lastCheckedAt: new Date().toISOString(),
      };
    }

    this.notifyListeners();
    return this.currentState;
  }

  async refreshNetworkState(): Promise<NetworkState> {
    if (NetInfo && typeof NetInfo.fetch === 'function') {
      try {
        const netState = await NetInfo.fetch();
        this.handleNetInfoChange(netState);
      } catch (e) {
        // Fallback to checking reachability directly
      }
    }
    return this.checkReachability();
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

  destroy() {
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }
    if (this.appStateSubscription && typeof this.appStateSubscription.remove === 'function') {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }
}

export const networkService = new MobileNetworkService();
