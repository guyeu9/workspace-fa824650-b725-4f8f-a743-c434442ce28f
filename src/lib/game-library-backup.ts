import pako from 'pako'

export interface GameData {
  id: string
  title: string
  description?: string
  data: {
    metadata: any
    data: any
  }
  createdAt: string
  updatedAt: string
}

export interface BackupMetadata {
  version: string
  createdAt: string
  gameCount: number
  totalSize: number
  appVersion: string
}

export interface BackupData {
  metadata: BackupMetadata
  games: GameData[]
}

export class GameLibraryBackup {
  private static readonly BACKUP_VERSION = '1.0'
  private static readonly CHUNK_SIZE = 100 // 每批处理的游戏数量

  /**
   * 创建游戏库备份
   */
  static async createBackup(games: GameData[]): Promise<BackupData> {
    try {
      const backupData: BackupData = {
        metadata: {
          version: this.BACKUP_VERSION,
          createdAt: new Date().toISOString(),
          gameCount: games.length,
          totalSize: this.calculateTotalSize(games),
          appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        },
        games: games,
      }

      return backupData
    } catch (error) {
      console.error('创建备份失败:', error)
      throw new Error('创建备份失败')
    }
  }

  /**
   * 验证备份数据
   */
  static validateBackup(backupData: any): { valid: boolean; error?: string } {
    try {
      if (!backupData || typeof backupData !== 'object') {
        return { valid: false, error: '无效的备份文件格式' }
      }

      if (!backupData.metadata || !backupData.games) {
        return { valid: false, error: '备份文件缺少必要的数据结构' }
      }

      const { metadata, games } = backupData

      if (!metadata.version || !metadata.createdAt || !metadata.gameCount) {
        return { valid: false, error: '备份元数据不完整' }
      }

      if (!Array.isArray(games)) {
        return { valid: false, error: '游戏数据格式错误' }
      }

      if (metadata.gameCount !== games.length) {
        return { valid: false, error: '游戏数量与元数据不匹配' }
      }

      // 验证每个游戏数据
      for (const game of games) {
        if (!game.id || !game.title || !game.data) {
          return { valid: false, error: '游戏数据格式错误' }
        }
      }

      return { valid: true }
    } catch (error) {
      return { valid: false, error: '备份文件验证失败' }
    }
  }

  /**
   * 恢复游戏库
   */
  static async restoreFromBackup(
    backupData: BackupData,
    options: {
      mergeMode?: 'replace' | 'merge' | 'skip'
      onProgress?: (progress: number, current: number, total: number) => void
    } = {}
  ): Promise<GameData[]> {
    const { mergeMode = 'merge', onProgress } = options

    try {
      const validation = this.validateBackup(backupData)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      const { games } = backupData
      const restoredGames: GameData[] = []
      const total = games.length

      // 分批处理以避免内存问题
      for (let i = 0; i < games.length; i += this.CHUNK_SIZE) {
        const chunk = games.slice(i, i + this.CHUNK_SIZE)
        
        for (const game of chunk) {
          try {
            const restoredGame = await this.processGame(game, mergeMode)
            if (restoredGame) {
              restoredGames.push(restoredGame)
            }
          } catch (error) {
            console.error(`恢复游戏失败: ${game.title}`, error)
            // 继续处理其他游戏
          }
        }

        // 报告进度
        if (onProgress) {
          const progress = Math.min((i + chunk.length) / total, 1)
          onProgress(progress, Math.min(i + chunk.length, total), total)
        }
      }

      return restoredGames
    } catch (error) {
      console.error('恢复备份失败:', error)
      throw new Error('恢复备份失败')
    }
  }

  /**
   * 处理单个游戏恢复
   */
  private static async processGame(
    game: GameData,
    mergeMode: 'replace' | 'merge' | 'skip'
  ): Promise<GameData | null> {
    try {
      // 验证游戏数据完整性
      if (!this.validateGameData(game)) {
        console.warn(`游戏数据验证失败: ${game.title}`)
        return null
      }

      // 根据合并模式处理
      switch (mergeMode) {
        case 'replace':
          // 完全替换现有数据
          return { ...game }
        
        case 'merge':
          // 合并数据，保留较新的版本
          return this.mergeGameData(game)
        
        case 'skip':
          // 跳过已存在的游戏
          return this.skipExistingGame(game) ? null : game
        
        default:
          return game
      }
    } catch (error) {
      console.error(`处理游戏失败: ${game.title}`, error)
      return null
    }
  }

  /**
   * 验证游戏数据
   */
  private static validateGameData(game: GameData): boolean {
    try {
      if (!game.id || !game.title || !game.data) {
        return false
      }

      // 验证游戏数据结构
      if (!game.data.metadata || !game.data.data) {
        return false
      }

      // 验证时间戳
      if (game.createdAt && isNaN(Date.parse(game.createdAt))) {
        return false
      }

      if (game.updatedAt && isNaN(Date.parse(game.updatedAt))) {
        return false
      }

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 合并游戏数据
   */
  private static mergeGameData(game: GameData): GameData {
    // 这里可以实现更复杂的合并逻辑
    // 例如：保留较新的更新时间，合并标签等
    return { ...game }
  }

  /**
   * 检查是否跳过已存在的游戏
   */
  private static skipExistingGame(game: GameData): boolean {
    // 这里可以实现检查逻辑
    // 例如：检查本地是否已存在相同ID的游戏
    return false
  }

  /**
   * 计算总大小
   */
  private static calculateTotalSize(games: GameData[]): number {
    try {
      const jsonString = JSON.stringify(games)
      return new Blob([jsonString]).size
    } catch (error) {
      return 0
    }
  }

  /**
   * 压缩备份数据
   */
  static async compressBackup(backupData: BackupData): Promise<string> {
    try {
      const jsonString = JSON.stringify(backupData)
      
      const encoder = new TextEncoder()
      const uint8Array = encoder.encode(jsonString)
      
      let binaryString = ''
      const len = uint8Array.length
      for (let i = 0; i < len; i++) {
        binaryString += String.fromCharCode(uint8Array[i])
      }
      
      return btoa(binaryString)
    } catch (error) {
      console.error('压缩备份失败:', error)
      throw new Error('压缩备份失败')
    }
  }

  /**
   * 解压缩备份数据
   */
  static async decompressBackup(compressedData: string): Promise<BackupData> {
    try {
      const binaryString = atob(compressedData)
      const len = binaryString.length
      
      const uint8Array = new Uint8Array(len)
      for (let i = 0; i < len; i++) {
        uint8Array[i] = binaryString.charCodeAt(i)
      }
      
      const decoder = new TextDecoder()
      const jsonString = decoder.decode(uint8Array)
      
      return JSON.parse(jsonString)
    } catch (error) {
      console.error('解压缩备份失败:', error)
      throw new Error('解压缩备份失败')
    }
  }

  /**
   * 导出备份文件
   */
  static async exportBackupFile(
    backupData: BackupData,
    filename?: string
  ): Promise<void> {
    try {
      const defaultFilename = `game-library-backup-${new Date().toISOString().split('T')[0]}.json`
      const finalFilename = filename || defaultFilename

      const jsonString = JSON.stringify(backupData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = finalFilename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('导出备份文件失败:', error)
      throw new Error('导出备份文件失败')
    }
  }

  /**
   * 从文件导入备份
   */
  static async importBackupFile(file: File): Promise<BackupData> {
    try {
      // 验证文件类型
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        throw new Error('请选择JSON格式的备份文件')
      }

      // 验证文件大小（最大50MB）
      const maxSize = 50 * 1024 * 1024
      if (file.size > maxSize) {
        throw new Error('备份文件过大（最大50MB）')
      }

      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string
            const backupData = JSON.parse(content)
            
            // 验证备份数据
            const validation = this.validateBackup(backupData)
            if (!validation.valid) {
              reject(new Error(validation.error))
              return
            }

            resolve(backupData)
          } catch (error) {
            reject(new Error('解析备份文件失败'))
          }
        }

        reader.onerror = () => {
          reject(new Error('读取文件失败'))
        }

        reader.readAsText(file)
      })
    } catch (error) {
      console.error('导入备份文件失败:', error)
      throw new Error('导入备份文件失败')
    }
  }

  /**
   * 获取备份统计信息
   */
  static getBackupStats(backupData: BackupData): {
    totalGames: number
    totalSize: number
    oldestGame: Date | null
    newestGame: Date | null
    averageGameSize: number
  } {
    try {
      const { games } = backupData
      
      if (games.length === 0) {
        return {
          totalGames: 0,
          totalSize: 0,
          oldestGame: null,
          newestGame: null,
          averageGameSize: 0,
        }
      }

      const dates = games
        .map(game => new Date(game.createdAt))
        .filter(date => !isNaN(date.getTime()))
        .sort((a, b) => a.getTime() - b.getTime())

      const totalSize = this.calculateTotalSize(games)

      return {
        totalGames: games.length,
        totalSize,
        oldestGame: dates[0] || null,
        newestGame: dates[dates.length - 1] || null,
        averageGameSize: totalSize / games.length,
      }
    } catch (error) {
      console.error('获取备份统计信息失败:', error)
      return {
        totalGames: 0,
        totalSize: 0,
        oldestGame: null,
        newestGame: null,
        averageGameSize: 0,
      }
    }
  }
}