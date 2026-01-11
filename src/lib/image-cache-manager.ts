import Dexie, { Table } from 'dexie';

export interface ImageCacheEntry {
  id?: number;
  fileHash: string;
  imageUrl: string;
  fileSize: number;
  uploadedAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
}

export class ImageCacheDatabase extends Dexie {
  imageCache!: Table<ImageCacheEntry>;

  constructor() {
    super('ImageCacheDB');
    this.version(1).stores({
      imageCache: '++id, fileHash, imageUrl, uploadedAt, lastAccessedAt, accessCount'
    });
  }
}

const db = new ImageCacheDatabase();

export class ImageCacheManager {
  private readonly CACHE_TTL = 30 * 24 * 60 * 60 * 1000;
  private readonly MAX_CACHE_SIZE = 10000;

  async checkCache(fileHash: string): Promise<string | null> {
    try {
      const entry = await db.imageCache
        .where('fileHash')
        .equals(fileHash)
        .first();

      if (!entry) {
        return null;
      }

      const now = new Date();
      const age = now.getTime() - entry.uploadedAt.getTime();

      if (age > this.CACHE_TTL) {
        await db.imageCache.delete(entry.id!);
        return null;
      }

      await db.imageCache.update(entry.id!, {
        lastAccessedAt: now,
        accessCount: entry.accessCount + 1
      });

      return entry.imageUrl;
    } catch (error) {
      console.error('检查缓存失败:', error);
      return null;
    }
  }

  async saveToCache(fileHash: string, imageUrl: string, fileSize: number): Promise<void> {
    try {
      const now = new Date();
      const entry: ImageCacheEntry = {
        fileHash,
        imageUrl,
        fileSize,
        uploadedAt: now,
        lastAccessedAt: now,
        accessCount: 1
      };

      await db.imageCache.add(entry);

      await this.cleanupCache();
    } catch (error) {
      console.error('保存缓存失败:', error);
    }
  }

  async batchCheckCache(fileHashes: string[]): Promise<Map<string, string>> {
    try {
      const entries = await db.imageCache
        .where('fileHash')
        .anyOf(fileHashes)
        .toArray();

      const result = new Map<string, string>();
      const now = new Date();

      for (const entry of entries) {
        const age = now.getTime() - entry.uploadedAt.getTime();

        if (age > this.CACHE_TTL) {
          await db.imageCache.delete(entry.id!);
          continue;
        }

        result.set(entry.fileHash, entry.imageUrl);

        await db.imageCache.update(entry.id!, {
          lastAccessedAt: now,
          accessCount: entry.accessCount + 1
        });
      }

      return result;
    } catch (error) {
      console.error('批量检查缓存失败:', error);
      return new Map();
    }
  }

  async batchSaveToCache(entries: Array<{ fileHash: string; imageUrl: string; fileSize: number }>): Promise<void> {
    try {
      const now = new Date();
      const cacheEntries: ImageCacheEntry[] = entries.map(entry => ({
        fileHash: entry.fileHash,
        imageUrl: entry.imageUrl,
        fileSize: entry.fileSize,
        uploadedAt: now,
        lastAccessedAt: now,
        accessCount: 1
      }));

      await db.imageCache.bulkAdd(cacheEntries);

      await this.cleanupCache();
    } catch (error) {
      console.error('批量保存缓存失败:', error);
    }
  }

  async getCacheStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
    averageAccessCount: number;
  }> {
    try {
      const entries = await db.imageCache.toArray();

      if (entries.length === 0) {
        return {
          totalEntries: 0,
          totalSize: 0,
          oldestEntry: null,
          newestEntry: null,
          averageAccessCount: 0
        };
      }

      const totalSize = entries.reduce((sum, entry) => sum + entry.fileSize, 0);
      const uploadedDates = entries.map(e => e.uploadedAt.getTime());
      const totalAccessCount = entries.reduce((sum, entry) => sum + entry.accessCount, 0);

      return {
        totalEntries: entries.length,
        totalSize,
        oldestEntry: new Date(Math.min(...uploadedDates)),
        newestEntry: new Date(Math.max(...uploadedDates)),
        averageAccessCount: totalAccessCount / entries.length
      };
    } catch (error) {
      console.error('获取缓存统计失败:', error);
      return {
        totalEntries: 0,
        totalSize: 0,
        oldestEntry: null,
        newestEntry: null,
        averageAccessCount: 0
      };
    }
  }

  async clearCache(): Promise<void> {
    try {
      await db.imageCache.clear();
    } catch (error) {
      console.error('清空缓存失败:', error);
    }
  }

  async clearExpiredCache(): Promise<number> {
    try {
      const now = new Date();
      const expiredDate = new Date(now.getTime() - this.CACHE_TTL);

      const expiredEntries = await db.imageCache
        .where('uploadedAt')
        .below(expiredDate)
        .toArray();

      const ids = expiredEntries.map(e => e.id!);
      await db.imageCache.bulkDelete(ids);

      return ids.length;
    } catch (error) {
      console.error('清理过期缓存失败:', error);
      return 0;
    }
  }

  private async cleanupCache(): Promise<void> {
    try {
      const count = await db.imageCache.count();

      if (count > this.MAX_CACHE_SIZE) {
        const entriesToDelete = await db.imageCache
          .orderBy('lastAccessedAt')
          .limit(count - this.MAX_CACHE_SIZE)
          .toArray();

        const ids = entriesToDelete.map(e => e.id!);
        await db.imageCache.bulkDelete(ids);
      }
    } catch (error) {
      console.error('清理缓存失败:', error);
    }
  }

  async removeByUrl(imageUrl: string): Promise<void> {
    try {
      await db.imageCache
        .where('imageUrl')
        .equals(imageUrl)
        .delete();
    } catch (error) {
      console.error('删除缓存条目失败:', error);
    }
  }

  async getAllCachedUrls(): Promise<string[]> {
    try {
      const entries = await db.imageCache.toArray();
      return entries.map(e => e.imageUrl);
    } catch (error) {
      console.error('获取所有缓存URL失败:', error);
      return [];
    }
  }
}
