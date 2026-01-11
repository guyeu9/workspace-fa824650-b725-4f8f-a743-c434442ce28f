'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Edit, 
  Upload, 
  Download,
  Trash2,
  Clock,
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  User
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface ResponsiveGameCardProps {
  game: {
    id: string
    title: string
    description?: string
    priority?: number
    createdAt: string
    updatedAt: string
    metadata?: {
      author?: string
      description?: string
    }
  }
  viewMode: 'local' | 'community'
  isSelected: boolean
  onSelect: () => void
  onPlay: () => void
  onEdit: () => void
  onExport: () => void
  onDelete: () => void
  onImport?: () => void
  upvotes?: number
  downvotes?: number
  commentsCount?: number
  author?: string
  onVote?: (type: 'UP' | 'DOWN') => void
  userVote?: 'UP' | 'DOWN' | null
}

export default function ResponsiveGameCard({
  game,
  viewMode,
  isSelected,
  onSelect,
  onPlay,
  onEdit,
  onExport,
  onDelete,
  onImport,
  upvotes = 0,
  downvotes = 0,
  commentsCount = 0,
  author,
  onVote,
  userVote
}: ResponsiveGameCardProps) {
  const getPriorityProps = (priority: number) => {
    const priorities = {
      1: { label: '低', color: 'bg-blue-100 text-blue-800' },
      2: { label: '中', color: 'bg-yellow-100 text-yellow-800' },
      3: { label: '高', color: 'bg-red-100 text-red-800' },
    }
    return priorities[priority as keyof typeof priorities] || { label: '普通', color: 'bg-gray-100 text-gray-800' }
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name.charAt(0).toUpperCase()
  }

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: zhCN })
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg truncate">
              {game.title}
            </CardTitle>
            {viewMode === 'local' && game.priority && (
              <Badge className={getPriorityProps(game.priority).color}>
                {getPriorityProps(game.priority).label}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 ml-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {viewMode === 'community' && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <User className="h-3 w-3" />
              <span className="truncate">{author || '匿名玩家'}</span>
            </div>
            {onVote && (
              <div className="flex items-center gap-1">
                <Button
                  variant={userVote === 'UP' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onVote('UP')}
                  className="h-6 px-2 text-xs"
                >
                  <ThumbsUp className="h-3 w-3" />
                  <span className="ml-1">{upvotes}</span>
                </Button>
                <Button
                  variant={userVote === 'DOWN' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => onVote('DOWN')}
                  className="h-6 px-2 text-xs"
                >
                  <ThumbsDown className="h-3 w-3" />
                  <span className="ml-1">{downvotes}</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {game.description && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">
            {game.description}
          </p>
        )}
        
        {viewMode === 'community' && (
          <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimeAgo(game.updatedAt)}
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {commentsCount}
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          {viewMode === 'local' ? (
            <>
              <Button
                size="sm"
                onClick={onPlay}
                className="flex-1 min-w-[80px]"
              >
                <Play className="h-4 w-4 mr-1" />
                开始
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="flex-1 min-w-[80px]"
              >
                <Edit className="h-4 w-4 mr-1" />
                编辑
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="flex-1 min-w-[80px]"
              >
                <Download className="h-4 w-4 mr-1" />
                导出
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="flex-1 min-w-[80px] text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                删除
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                onClick={onImport}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Upload className="h-4 w-4 mr-1" />
                一键导入到本地游戏库
              </Button>
            </>
          )}
        </div>
        
        {viewMode === 'local' && (
          <div className="mt-3 pt-3 border-t text-xs text-slate-500 flex justify-between">
            <span>创建: {formatTimeAgo(game.createdAt)}</span>
            <span>更新: {formatTimeAgo(game.updatedAt)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}