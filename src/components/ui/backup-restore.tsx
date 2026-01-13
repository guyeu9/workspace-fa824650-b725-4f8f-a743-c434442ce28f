'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Download, 
  Upload, 
  FileText, 
  Clock, 
  Gamepad2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { GameLibraryBackup, BackupData, BackupMetadata } from '@/lib/game-library-backup'
import { enhancedGameStore } from '@/lib/game-importer'

interface BackupRestoreProps {
  className?: string
}

export default function BackupRestore({ className = '' }: BackupRestoreProps) {
  const { toast } = useToast()
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [backupProgress, setBackupProgress] = useState(0)
  const [restoreProgress, setRestoreProgress] = useState(0)
  const [backupStats, setBackupStats] = useState<BackupMetadata | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleBackup = async () => {
    try {
      setIsBackingUp(true)
      setError(null)
      setBackupProgress(0)

      // 获取所有游戏
      const games = await enhancedGameStore.getAllGamesForBackup()
      
      // 创建备份
      const backupData = await GameLibraryBackup.createBackup(games)
      
      // 更新统计信息
      setBackupStats(backupData.metadata)
      
      // 模拟进度
      for (let i = 0; i <= 100; i += 10) {
        setBackupProgress(i)
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // 导出备份文件
      await GameLibraryBackup.exportBackupFile(backupData)

      toast({
        title: '备份成功',
        description: `已备份 ${games.length} 个游戏`,
      })
    } catch (error) {
      console.error('备份失败:', error)
      setError(error instanceof Error ? error.message : '备份失败')
      toast({
        title: '备份失败',
        description: error instanceof Error ? error.message : '备份过程中出现错误',
        variant: 'destructive',
      })
    } finally {
      setIsBackingUp(false)
      setBackupProgress(0)
    }
  }

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      console.log('未选择文件')
      return
    }

    try {
      setIsRestoring(true)
      setError(null)
      setRestoreProgress(0)
      
      // 显示文件选择成功提示
      toast({
        title: '正在处理',
        description: `正在处理备份文件: ${file.name}`,
      })

      // 导入备份文件
      console.log('开始导入备份文件:', file.name, '文件大小:', file.size)
      const backupData = await GameLibraryBackup.importBackupFile(file)
      console.log('备份文件导入成功，完整备份数据:', JSON.stringify(backupData, null, 2))
      
      // 获取统计信息
      const stats = GameLibraryBackup.getBackupStats(backupData)
      setBackupStats({
        version: '1.0',
        createdAt: stats.newestGame?.toISOString() || new Date().toISOString(),
        gameCount: stats.totalGames,
        totalSize: stats.totalSize,
        appVersion: '1.0.0',
      })

      // 调用restoreFromBackup方法处理备份数据
      console.log('开始恢复游戏...')
      let restoredGames: any[] = []
      try {
        restoredGames = await GameLibraryBackup.restoreFromBackup(
          backupData,
          {
            mergeMode: 'merge',
            onProgress: (progress, current, total) => {
              const progressPercent = Math.round(progress * 100)
              setRestoreProgress(progressPercent)
              console.log(`恢复进度: ${progressPercent}% (${current}/${total})`)
            },
          }
        )
      } catch (restoreError) {
        console.error('restoreFromBackup失败:', restoreError)
        throw new Error(`恢复处理失败: ${restoreError instanceof Error ? restoreError.message : '未知错误'}`)
      }
      
      const totalGames = restoredGames.length
      
      if (totalGames === 0) {
        console.log('没有可恢复的游戏')
        toast({
          title: '恢复完成',
          description: '没有可恢复的游戏数据',
          variant: 'destructive',
        })
        return
      }

      // 将恢复的游戏添加到本地存储
      console.log('开始保存恢复的游戏...')
      let savedCount = 0
      for (let i = 0; i < totalGames; i++) {
        const game = restoredGames[i]
        console.log(`处理第 ${i + 1} 个游戏:`, JSON.stringify(game, null, 2))
        
        if (game) {
          try {
            // 准备创建游戏的参数
            const gameTitle = game.title || '未命名游戏'
            console.log(`游戏标题: ${gameTitle}`)
            
            // 获取游戏数据 - 直接使用game.data.data，这是从getAllGamesForBackup中构建的格式
            const gameData = game.data?.data || {} 
            console.log(`游戏数据:`, JSON.stringify(gameData, null, 2))
            
            // 从game.data.metadata中提取createGame需要的选项
            const metadata = game.data?.metadata || {} 
            const options = {
              description: metadata.description || '',
              tags: metadata.tags || [],
              author: metadata.author || 'Unknown',
              thumbnailAssetId: metadata.thumbnailAssetId,
              backgroundAssetId: metadata.backgroundAssetId
            }
            console.log(`游戏选项:`, JSON.stringify(options, null, 2))
            
            // 调用createGame保存游戏 - 使用正确的参数格式
            console.log('准备调用createGame...')
            await enhancedGameStore.createGame(gameTitle, gameData, options)
            savedCount++
            console.log(`保存游戏成功: ${gameTitle} (${i + 1}/${totalGames})`)
          } catch (saveError) {
            console.error(`保存游戏失败: ${game.title || '未知游戏'}`, saveError, '错误详情:', saveError instanceof Error ? saveError.stack : '')
            // 继续保存其他游戏
          }
        }
      }
      console.log('游戏保存完成，成功保存:', savedCount, '个')

      if (savedCount > 0) {
        toast({
          title: '恢复成功',
          description: `已恢复并保存 ${savedCount} 个游戏`,
        })
      } else {
        toast({
          title: '恢复失败',
          description: '没有成功恢复任何游戏',
          variant: 'destructive',
        })
      }

      // 重置文件输入
      event.target.value = ''
    } catch (error) {
      console.error('恢复失败:', error)
      const errorMessage = error instanceof Error ? error.message : '恢复过程中出现错误'
      setError(errorMessage)
      toast({
        title: '恢复失败',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsRestoring(false)
      setRestoreProgress(0)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  return (
    <Card className={`${className} bg-white border-2 border-slate-300 transition-all duration-200 hover:shadow-2xl`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          游戏库备份与恢复
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 备份和恢复按钮 */}
        <div className="flex gap-2">
          {/* 导出按钮 - 蓝色 */}
          <Button
            onClick={handleBackup}
            disabled={isBackingUp}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 flex items-center gap-2 flex-1"
          >
            <Download className="h-4 w-4" />
            {isBackingUp ? '备份中...' : '立即备份'}
          </Button>

          {/* 导入按钮 - 绿色渐变 */}
          <Button
            disabled={isRestoring}
            size="sm"
            className="relative bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white transition-all duration-300 flex items-center gap-2 flex-1"
          >
            <Upload className="h-4 w-4" />
            {isRestoring ? '恢复中...' : '备份合并本地'}
            <input
              type="file"
              accept=".json"
              onChange={handleRestore}
              disabled={isRestoring}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </Button>
        </div>

        {/* 备份进度 */}
        {isBackingUp && (
          <div className="space-y-2">
            <Progress value={backupProgress} className="w-full" />
            <p className="text-sm text-gray-600 text-center">
              备份进度: {backupProgress}%
            </p>
          </div>
        )}

        {/* 恢复进度 */}
        {isRestoring && (
          <div className="space-y-2">
            <Progress value={restoreProgress} className="w-full" />
            <p className="text-sm text-gray-600 text-center">
              恢复进度: {restoreProgress}%
            </p>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 备份统计 */}
        {backupStats && (
          <div className="mt-4 border rounded-lg p-3 bg-gray-50">
            <h4 className="font-medium flex items-center gap-2 mb-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              备份信息
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-gray-500" />
                <span>游戏数量: {backupStats.gameCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span>文件大小: {formatFileSize(backupStats.totalSize)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>创建时间: {formatDate(backupStats.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span>版本: {backupStats.version}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}