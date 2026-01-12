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
    if (!file) return

    try {
      setIsRestoring(true)
      setError(null)
      setRestoreProgress(0)

      // 导入备份文件
      const backupData = await GameLibraryBackup.importBackupFile(file)
      
      // 验证备份
      const validation = GameLibraryBackup.validateBackup(backupData)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // 获取统计信息
      const stats = GameLibraryBackup.getBackupStats(backupData)
      setBackupStats({
        version: '1.0',
        createdAt: stats.newestGame?.toISOString() || new Date().toISOString(),
        gameCount: stats.totalGames,
        totalSize: stats.totalSize,
        appVersion: '1.0.0',
      })

      // 恢复游戏
      const restoredGames = await GameLibraryBackup.restoreFromBackup(
        backupData,
        {
          mergeMode: 'merge',
          onProgress: (progress, current, total) => {
            setRestoreProgress(Math.round(progress * 100))
          },
        }
      )

      // 将恢复的游戏添加到本地存储
      for (const game of restoredGames) {
        if (game) {
          await enhancedGameStore.saveGame(game.title, game.data, game.metadata)
        }
      }

      toast({
        title: '恢复成功',
        description: `已恢复 ${restoredGames.length} 个游戏`,
      })

      // 重置文件输入
      event.target.value = ''
    } catch (error) {
      console.error('恢复失败:', error)
      setError(error instanceof Error ? error.message : '恢复失败')
      toast({
        title: '恢复失败',
        description: error instanceof Error ? error.message : '恢复过程中出现错误',
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
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          游戏库备份与恢复
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 备份功能 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">备份游戏库</h3>
              <p className="text-sm text-gray-600">
                将您的所有游戏导出为备份文件
              </p>
            </div>
            <Button
              onClick={handleBackup}
              disabled={isBackingUp}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isBackingUp ? '备份中...' : '立即备份'}
            </Button>
          </div>

          {isBackingUp && (
            <div className="space-y-2">
              <Progress value={backupProgress} className="w-full" />
              <p className="text-sm text-gray-600 text-center">
                备份进度: {backupProgress}%
              </p>
            </div>
          )}
        </div>

        {/* 恢复功能 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">恢复游戏库</h3>
              <p className="text-sm text-gray-600">
                从备份文件恢复您的游戏
              </p>
            </div>
            <Button
              variant="outline"
              disabled={isRestoring}
              className="relative flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {isRestoring ? '恢复中...' : '选择备份文件'}
              <input
                type="file"
                accept=".json"
                onChange={handleRestore}
                disabled={isRestoring}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </Button>
          </div>

          {isRestoring && (
            <div className="space-y-2">
              <Progress value={restoreProgress} className="w-full" />
              <p className="text-sm text-gray-600 text-center">
                恢复进度: {restoreProgress}%
              </p>
            </div>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 备份统计 */}
        {backupStats && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              备份信息
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
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

        {/* 使用说明 */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">使用说明</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 备份文件包含您的所有游戏数据和元信息</li>
            <li>• 建议定期备份以防止数据丢失</li>
            <li>• 恢复时会合并现有游戏，不会删除原有数据</li>
            <li>• 备份文件格式为JSON，可以手动编辑</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}