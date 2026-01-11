'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Star, 
  TrendingUp, 
  Users, 
  Clock,
  ThumbsUp,
  MessageSquare,
  Play,
  Download,
  Gamepad2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface RecommendedGame {
  id: string
  title: string
  description: string
  coverUrl?: string
  author: {
    id: string
    name: string
    email: string
  }
  upvotes: number
  downvotes: number
  commentsCount: number
  createdAt: string
  score: number
  reason: 'trending' | 'popular' | 'similar' | 'new'
}

interface GameRecommendationsProps {
  userId?: string
  currentGameId?: string
  limit?: number
}

export default function GameRecommendations({ 
  userId, 
  currentGameId, 
  limit = 6 
}: GameRecommendationsProps) {
  const router = useRouter()
  const [recommendations, setRecommendations] = useState<RecommendedGame[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecommendations()
  }, [userId, currentGameId])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      // 这里可以调用实际的推荐API
      // 暂时使用模拟数据
      const mockRecommendations: RecommendedGame[] = [
        {
          id: '1',
          title: '神秘森林探险',
          description: '一个充满神秘和冒险的森林探索游戏，玩家需要在森林中寻找宝藏并解开古老的谜题。',
          author: {
            id: '1',
            name: '冒险家',
            email: 'adventurer@example.com'
          },
          upvotes: 42,
          downvotes: 3,
          commentsCount: 15,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          score: 4.8,
          reason: 'trending'
        },
        {
          id: '2',
          title: '时间旅行者',
          description: '穿越时空的冒险故事，在不同的时代中解决谜题，改变历史的进程。',
          author: {
            id: '2',
            name: '时空旅者',
            email: 'traveler@example.com'
          },
          upvotes: 38,
          downvotes: 2,
          commentsCount: 12,
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          score: 4.7,
          reason: 'popular'
        },
        {
          id: '3',
          title: '魔法学院',
          description: '在魔法学院中学习各种魔法，结交朋友，对抗黑暗势力，成为最强大的魔法师。',
          author: {
            id: '3',
            name: '魔法师',
            email: 'wizard@example.com'
          },
          upvotes: 35,
          downvotes: 1,
          commentsCount: 18,
          createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
          score: 4.6,
          reason: 'new'
        }
      ]
      
      setRecommendations(mockRecommendations.slice(0, limit))
    } catch (error) {
      console.error('获取推荐失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRecommendationReason = (reason: string) => {
    const reasons = {
      trending: { label: '热门', color: 'bg-red-100 text-red-800' },
      popular: { label: '受欢迎', color: 'bg-green-100 text-green-800' },
      similar: { label: '相似', color: 'bg-blue-100 text-blue-800' },
      new: { label: '新发布', color: 'bg-purple-100 text-purple-800' },
    }
    return reasons[reason as keyof typeof reasons] || { label: '推荐', color: 'bg-gray-100 text-gray-800' }
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name.charAt(0).toUpperCase()
  }

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: zhCN })
  }

  const handlePlayGame = (gameId: string) => {
    router.push(`/games/${gameId}`)
  }

  const handleImportGame = async (gameId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // 这里可以实现导入逻辑
    console.log('导入游戏:', gameId)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            推荐游戏
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-32 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            推荐游戏
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>暂无推荐游戏</p>
            <p className="text-sm mt-2">浏览更多游戏来获得个性化推荐</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          为您推荐
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((game) => {
            const reason = getRecommendationReason(game.reason)
            const score = ((game.upvotes / (game.upvotes + game.downvotes)) * 5).toFixed(1)
            
            return (
              <div
                key={game.id}
                className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
                onClick={() => handlePlayGame(game.id)}
              >
                {/* 封面图片 */}
                {game.coverUrl ? (
                  <img
                    src={game.coverUrl}
                    alt={game.title}
                    className="w-full h-32 object-cover rounded-lg mb-3 group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-3 flex items-center justify-center">
                    <Gamepad2 className="h-12 w-12 text-white opacity-50" />
                  </div>
                )}

                {/* 推荐标签 */}
                <div className="flex items-center justify-between mb-2">
                  <Badge className={reason.color}>
                    {reason.label}
                  </Badge>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">{score}</span>
                  </div>
                </div>

                {/* 游戏标题 */}
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {game.title}
                </h3>

                {/* 游戏描述 */}
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {game.description}
                </p>

                {/* 作者信息 */}
                <div className="flex items-center gap-2 mb-3">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>
                      {getInitials(game.author.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-500 truncate">
                    {game.author.name}
                  </span>
                </div>

                {/* 统计信息 */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      <span>{game.upvotes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{game.commentsCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeAgo(game.createdAt)}</span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlayGame(game.id)
                    }}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    开始游戏
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => handleImportGame(game.id, e)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    导入
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* 底部操作 */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              基于您的游戏历史和社区互动为您推荐
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRecommendations}
            >
              刷新推荐
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}