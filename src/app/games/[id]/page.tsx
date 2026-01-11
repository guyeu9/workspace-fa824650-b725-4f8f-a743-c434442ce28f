'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  ArrowLeft,
  User,
  Calendar,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Gamepad2,
  Download
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import VoteButtons from '@/components/community/VoteButtons'
import CommentsSection from '@/components/community/CommentsSection'

interface GameDetail {
  id: string
  title: string
  description: string | null
  coverUrl: string | null
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string | null
    email: string
  }
  jsonData: any
  _count?: {
    votes: number
    comments: number
  }
  upvotes?: number
  downvotes?: number
}

export default function GameDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [game, setGame] = useState<GameDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const gameId = params.id as string

  useEffect(() => {
    fetchGameDetail()
  }, [gameId])

  const fetchGameDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/games/${gameId}`)
      
      if (!response.ok) {
        throw new Error('获取游戏详情失败')
      }

      const data = await response.json()
      setGame(data)
    } catch (error) {
      console.error('获取游戏详情失败:', error)
      toast({
        title: '错误',
        description: '获取游戏详情失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImportGame = async () => {
    if (!game) return

    try {
      const metadata = {
        title: game.title,
        description: game.description || '',
        author: game.author.name || game.author.email,
        tags: []
      }

      // 这里需要调用游戏存储逻辑
      // 暂时使用localStorage作为示例
      localStorage.setItem('importedGame', JSON.stringify({
        title: game.title,
        data: game.jsonData,
        metadata
      }))

      toast({
        title: '导入成功',
        description: '游戏已导入到本地库',
      })

      router.push('/game-library')
    } catch (error) {
      console.error('导入游戏失败:', error)
      toast({
        title: '导入失败',
        description: '请稍后重试',
        variant: 'destructive',
      })
    }
  }

  const handlePlayGame = () => {
    if (!game) return

    // 将游戏数据存储到sessionStorage
    sessionStorage.setItem('gameData', JSON.stringify(game.jsonData))
    router.push('/')
  }

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: zhCN 
    })
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.charAt(0).toUpperCase()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">游戏不存在</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 顶部导航 */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/game-library')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回游戏库
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">游戏详情</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 游戏信息 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{game.title}</CardTitle>
                    {game.description && (
                      <p className="text-gray-600 mt-2">{game.description}</p>
                    )}
                  </div>
                  {game.coverUrl && (
                    <img
                      src={game.coverUrl}
                      alt={game.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 作者信息 */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {getInitials(game.author.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{game.author.name || '匿名作者'}</div>
                      <div className="text-sm text-gray-500">{game.author.email}</div>
                    </div>
                  </div>

                  {/* 统计信息 */}
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatTimeAgo(game.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {game._count?.comments || 0} 评论
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      {game.upvotes || 0} 点赞
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsDown className="h-4 w-4" />
                      {game.downvotes || 0} 点踩
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={handlePlayGame}
                      className="flex items-center gap-2"
                    >
                      <Gamepad2 className="h-4 w-4" />
                      开始游戏
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleImportGame}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      导入到本地
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 投票 */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>为游戏投票</CardTitle>
              </CardHeader>
              <CardContent>
                <VoteButtons
                  gameId={game.id}
                  initialUpvotes={game.upvotes || 0}
                  initialDownvotes={game.downvotes || 0}
                />
              </CardContent>
            </Card>

            {/* 评论区域 */}
            <CommentsSection gameId={game.id} />
          </div>

          {/* 侧边栏 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>游戏信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">游戏ID</div>
                  <div className="font-mono text-xs">{game.id}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">创建时间</div>
                  <div className="text-sm">{new Date(game.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">更新时间</div>
                  <div className="text-sm">{new Date(game.updatedAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">作者</div>
                  <div className="text-sm">{game.author.name || game.author.email}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}