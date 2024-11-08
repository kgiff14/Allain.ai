// services/memoryManagementService.ts
import { Subject } from 'rxjs';

export interface StorageUsage {
  vectorStore: {
    used: number;
    quota: number;
    percentage: number;
  };
  localStorage: {
    used: number;
    quota: number;
    percentage: number;
  };
  timestamp: string;
}

class MemoryManagementService {
  private historyData: StorageUsage[] = [];
  private readonly MAX_HISTORY_POINTS = 50;
  private updateInterval: any = null;
  private usageSubject = new Subject<StorageUsage[]>();

  // Observable for components to subscribe to
  public usage$ = this.usageSubject.asObservable();

  constructor() {
    // Start monitoring when service is instantiated
    this.startMonitoring();
  }

  private async getStorageUsage(): Promise<StorageUsage> {
    try {
      // IndexedDB usage
      const vectorStoreUsage = await navigator.storage.estimate();
      const vectorStoreQuota = vectorStoreUsage.quota || 0;
      const vectorStoreUsed = vectorStoreUsage.usage || 0;

      // LocalStorage usage
      const localStorageUsed = new Blob(Object.values(localStorage)).size;
      const localStorageQuota = 10 * 1024 * 1024; // 10MB typical limit

      return {
        vectorStore: {
          used: vectorStoreUsed,
          quota: vectorStoreQuota,
          percentage: (vectorStoreUsed / vectorStoreQuota) * 100
        },
        localStorage: {
          used: localStorageUsed,
          quota: localStorageQuota,
          percentage: (localStorageUsed / localStorageQuota) * 100
        },
        timestamp: new Date().toLocaleTimeString()
      };
    } catch (error) {
      console.error('Error getting storage usage:', error);
      throw error;
    }
  }

  private async updateUsageData() {
    try {
      const usage = await this.getStorageUsage();
      
      // Add new data point
      this.historyData.push(usage);
      
      // Keep only the last MAX_HISTORY_POINTS points
      if (this.historyData.length > this.MAX_HISTORY_POINTS) {
        this.historyData = this.historyData.slice(-this.MAX_HISTORY_POINTS);
      }
      
      // Notify subscribers
      this.usageSubject.next(this.historyData);
    } catch (error) {
      console.error('Error updating usage data:', error);
    }
  }

  public startMonitoring(interval: number = 30000) {
    // Initial update
    this.updateUsageData();
    
    // Set up periodic updates
    this.updateInterval = setInterval(() => {
      this.updateUsageData();
    }, interval);
  }

  public stopMonitoring() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  public getHistoryData(): StorageUsage[] {
    return [...this.historyData];
  }

  // Force an immediate update
  public async forceUpdate() {
    await this.updateUsageData();
  }
}

export const memoryManagementService = new MemoryManagementService();