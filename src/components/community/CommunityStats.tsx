'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  Users, 
  Gamepad2, 
  MessageSquare,
  Star,
  Clock,
  Filter,
  Search
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { apiClient } from '@/lib/api-client'

interface CommunityStats {
  totalGames: number
  totalUsers: number
  totalComments: number
  totalVotes: number
  recentGames: number
  trendingGames: number
}

interface FilterOptions {
  sortBy: 'newest' | 'popular' | 'trending' | 'mostVoted'
  timeRange: 'all' | 'today' | 'week' | 'month'
  category?: string
}

export default function CommunityStats() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<CommunityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'newest',
    timeRange: 'all',
  })

  useEffect(() => {
    fetchStats()
  }, [filters])

  const fetchStats = async () => {
    try {
      setLoading(true)
      // 这里可以调用实际的统计API
      // 暂时使用模拟数据
      setStats({
        totalGames: 156,
        totalUsers: 89,
        totalComments: 234,
        totalVotes: 567,
        recentGames: 12,
        trendingGames: 8,
      })
    } catch (error) {
      console.error('获取社区统计失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSortLabel = (sortBy: string) => {
    const labels = {
      newest: '最新发布',
      popular: '最受欢迎',
      trending: '热门趋势',
      mostVoted: '最多投票',
    }
    return labels[sortBy as keyof typeof labels] || '最新发布'
  }

  const getTimeRangeLabel = (timeRange: string) => {
    const labels = {
      all: '全部时间',
      today: '今天',
      week: '本周',
      month: '本月',
    }
    return labels[timeRange as keyof typeof labels] || '全部时间'
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总游戏数</p>
                <p className="text-2xl font-bold">{stats.totalGames}</p>
              </div>
              <Gamepad2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总用户数</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总评论数</p>
                <p className="text-2xl font-bold">{stats.totalComments}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总投票数</p>
                <p className="text-2xl font-bold">{stats.totalVotes}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">新游戏</p>
                <p className="text-2xl font-bold">{stats.recentGames}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">热门游戏</p>
                <p className="text-2xl font-bold">{stats.trendingGames}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            筛选选项
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">排序方式</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">最新发布</option>
                <option value="popular">最受欢迎</option>
                <option value="trending">热门趋势</option>
                <option value="mostVoted">最多投票</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">时间范围</label>
              <select
                value={filters.timeRange}
                onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部时间</option>
                <option value="today">今天</option>
                <option value="week">本周</option>
                <option value="month">本月</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">分类</label>
              <select
                value={filters.category || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部分类</option>
                <option value="adventure">冒险</option>
                <option value="puzzle">解谜</option>
                <option value="story">故事</option>
                <option value="action">动作</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">搜索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                placeholder="搜索游戏..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Badge variant="outline">
              排序: {getSortLabel(filters.sortBy)}
            </Badge>
            <Badge variant="outline">
              时间: {getTimeRangeLabel(filters.timeRange)}
            </Badge>
            {filters.category && (
              <Badge variant="outline">
                分类: {filters.category}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}