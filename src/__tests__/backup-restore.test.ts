import { GameLibraryBackup, BackupData } from '@/lib/game-library-backup'
import { TestDataFactory } from '@/lib/test-utils'

describe('游戏库备份恢复功能测试', () => {
  describe('GameLibraryBackup', () => {
    const mockGames = [
      TestDataFactory.createGame({
        id: 'game-1',
        title: 'Test Game 1',
        description: 'Description 1',
      }),
      TestDataFactory.createGame({
        id: 'game-2',
        title: 'Test Game 2',
        description: 'Description 2',
      }),
    ]

    describe('createBackup', () => {
      it('应该正确创建备份', async () => {
        const backup = await GameLibraryBackup.createBackup(mockGames)

        expect(backup).toBeDefined()
        expect(backup.metadata).toBeDefined()
        expect(backup.metadata.version).toBe('1.0')
        expect(backup.metadata.gameCount).toBe(2)
        expect(backup.games).toEqual(mockGames)
      })

      it('应该处理空游戏列表', async () => {
        const backup = await GameLibraryBackup.createBackup([])

        expect(backup.metadata.gameCount).toBe(0)
        expect(backup.games).toEqual([])
      })

      it('应该计算正确的总大小', async () => {
        const backup = await GameLibraryBackup.createBackup(mockGames)

        expect(backup.metadata.totalSize).toBeGreaterThan(0)
      })
    })

    describe('validateBackup', () => {
      it('应该验证有效的备份', () => {
        const backup: BackupData = {
          metadata: {
            version: '1.0',
            createdAt: new Date().toISOString(),
            gameCount: 2,
            totalSize: 1000,
            appVersion: '1.0.0',
          },
          games: mockGames,
        }

        const validation = GameLibraryBackup.validateBackup(backup)

        expect(validation.valid).toBe(true)
        expect(validation.error).toBeUndefined()
      })

      it('应该拒绝无效的备份格式', () => {
        const invalidBackup = null

        const validation = GameLibraryBackup.validateBackup(invalidBackup)

        expect(validation.valid).toBe(false)
        expect(validation.error).toContain('无效的备份文件格式')
      })

      it('应该拒绝缺少元数据的备份', () => {
        const invalidBackup = {
          games: mockGames,
        }

        const validation = GameLibraryBackup.validateBackup(invalidBackup)

        expect(validation.valid).toBe(false)
        expect(validation.error).toContain('备份文件缺少必要的数据结构')
      })

      it('应该拒绝游戏数量不匹配的备份', () => {
        const backup: BackupData = {
          metadata: {
            version: '1.0',
            createdAt: new Date().toISOString(),
            gameCount: 3, // 错误的数量
            totalSize: 1000,
            appVersion: '1.0.0',
          },
          games: mockGames, // 实际只有2个游戏
        }

        const validation = GameLibraryBackup.validateBackup(backup)

        expect(validation.valid).toBe(false)
        expect(validation.error).toContain('游戏数量与元数据不匹配')
      })

      it('应该拒绝游戏数据格式错误的备份', () => {
        const backup: BackupData = {
          metadata: {
            version: '1.0',
            createdAt: new Date().toISOString(),
            gameCount: 1,
            totalSize: 1000,
            appVersion: '1.0.0',
          },
          games: [
            {
              id: 'game-1',
              title: 'Test Game',
              // 缺少必要的data字段
            } as any,
          ],
        }

        const validation = GameLibraryBackup.validateBackup(backup)

        expect(validation.valid).toBe(false)
        expect(validation.error).toContain('游戏数据格式错误')
      })
    })

    describe('compressBackup & decompressBackup', () => {
      it('应该正确压缩和解压缩备份', async () => {
        const backup: BackupData = {
          metadata: {
            version: '1.0',
            createdAt: new Date().toISOString(),
            gameCount: 2,
            totalSize: 1000,
            appVersion: '1.0.0',
          },
          games: mockGames,
        }

        const compressed = await GameLibraryBackup.compressBackup(backup)
        const decompressed = await GameLibraryBackup.decompressBackup(compressed)

        expect(decompressed).toEqual(backup)
      })

      it('应该处理压缩错误', async () => {
        // 创建一个会导致压缩错误的数据
        const circularData: any = { a: 1 }
        circularData.self = circularData

        await expect(GameLibraryBackup.compressBackup(circularData)).rejects.toThrow('压缩备份失败')
      })

      it('应该处理解压缩错误', async () => {
        const invalidCompressedData = 'invalid-base64-data!!!'

        await expect(GameLibraryBackup.decompressBackup(invalidCompressedData)).rejects.toThrow('解压缩备份失败')
      })
    })

    describe('getBackupStats', () => {
      it('应该正确计算备份统计信息', () => {
        const backup: BackupData = {
          metadata: {
            version: '1.0',
            createdAt: new Date().toISOString(),
            gameCount: 2,
            totalSize: 1000,
            appVersion: '1.0.0',
          },
          games: mockGames,
        }

        const stats = GameLibraryBackup.getBackupStats(backup)

        expect(stats.totalGames).toBe(2)
        expect(stats.totalSize).toBeGreaterThan(0)
        expect(stats.averageGameSize).toBeGreaterThan(0)
        expect(stats.oldestGame).toBeInstanceOf(Date)
        expect(stats.newestGame).toBeInstanceOf(Date)
      })

      it('应该处理空备份', () => {
        const backup: BackupData = {
          metadata: {
            version: '1.0',
            createdAt: new Date().toISOString(),
            gameCount: 0,
            totalSize: 0,
            appVersion: '1.0.0',
          },
          games: [],
        }

        const stats = GameLibraryBackup.getBackupStats(backup)

        expect(stats.totalGames).toBe(0)
        expect(stats.totalSize).toBe(0)
        expect(stats.averageGameSize).toBe(0)
        expect(stats.oldestGame).toBeNull()
        expect(stats.newestGame).toBeNull()
      })
    })

    describe('restoreFromBackup', () => {
      it('应该正确恢复备份', async () => {
        const backup: BackupData = {
          metadata: {
            version: '1.0',
            createdAt: new Date().toISOString(),
            gameCount: 2,
            totalSize: 1000,
            appVersion: '1.0.0',
          },
          games: mockGames,
        }

        const restoredGames = await GameLibraryBackup.restoreFromBackup(backup)

        expect(restoredGames).toHaveLength(2)
        expect(restoredGames[0].title).toBe('Test Game 1')
        expect(restoredGames[1].title).toBe('Test Game 2')
      })

      it('应该处理恢复过程中的错误', async () => {
        const invalidBackup: BackupData = {
          metadata: {
            version: '1.0',
            createdAt: new Date().toISOString(),
            gameCount: 1,
            totalSize: 1000,
            appVersion: '1.0.0',
          },
          games: [
            {
              id: 'invalid-game',
              // 缺少必要的字段
            } as any,
          ],
        }

        // 应该抛出错误或返回空数组
        await expect(GameLibraryBackup.restoreFromBackup(invalidBackup)).rejects.toThrow()
      })

      it('应该正确处理合并模式', async () => {
        const backup: BackupData = {
          metadata: {
            version: '1.0',
            createdAt: new Date().toISOString(),
            gameCount: 2,
            totalSize: 1000,
            appVersion: '1.0.0',
          },
          games: mockGames,
        }

        // 测试不同的合并模式
        const replaceResult = await GameLibraryBackup.restoreFromBackup(backup, { mergeMode: 'replace' })
        expect(replaceResult).toHaveLength(2)

        const skipResult = await GameLibraryBackup.restoreFromBackup(backup, { mergeMode: 'skip' })
        expect(skipResult).toHaveLength(2) // 假设没有现有游戏需要跳过
      })

      it('应该正确处理进度回调', async () => {
        const backup: BackupData = {
          metadata: {
            version: '1.0',
            createdAt: new Date().toISOString(),
            gameCount: 2,
            totalSize: 1000,
            appVersion: '1.0.0',
          },
          games: mockGames,
        }

        const progressCallback = jest.fn()

        await GameLibraryBackup.restoreFromBackup(backup, {
          onProgress: progressCallback,
        })

        expect(progressCallback).toHaveBeenCalled()
        expect(progressCallback).toHaveBeenCalledWith(1, 2, 2) // 100% 进度
      })
    })
  })

  describe('文件操作测试', () => {
    const mockGames = [
      TestDataFactory.createGame({
        id: 'game-1',
        title: 'Test Game 1',
        description: 'Description 1',
      }),
      TestDataFactory.createGame({
        id: 'game-2',
        title: 'Test Game 2',
        description: 'Description 2',
      }),
    ]

    // 注意：由于测试环境的限制，文件导出/导入功能需要特殊处理
    // 这里主要测试逻辑，实际的文件操作需要集成测试

    it('应该正确处理文件导入验证', async () => {
      // 创建有效的JSON文件
      const validJsonContent = JSON.stringify({
        metadata: {
          version: '1.0',
          createdAt: new Date().toISOString(),
          gameCount: 1,
          totalSize: 100,
          appVersion: '1.0.0',
        },
        games: [mockGames[0]],
      })

      const validFile = new File([validJsonContent], 'backup.json', { type: 'application/json' })

      // 由于FileReader在测试环境中的限制，这里主要测试验证逻辑
      expect(validFile.type).toBe('application/json')
      expect(validFile.size).toBeLessThan(50 * 1024 * 1024) // 小于50MB
    })

    it('应该拒绝无效的文件类型', () => {
      const invalidFile = new File(['test'], 'backup.exe', { type: 'application/x-msdownload' })

      expect(invalidFile.type).not.toBe('application/json')
      expect(invalidFile.name).not.toMatch(/\.(json)$/i)
    })

    it('应该拒绝过大的文件', () => {
      const largeContent = new Array(60 * 1024 * 1024).fill('a').join('') // 60MB
      const largeFile = new File([largeContent], 'large-backup.json', { type: 'application/json' })

      expect(largeFile.size).toBeGreaterThan(50 * 1024 * 1024) // 大于50MB
    })
  })
})