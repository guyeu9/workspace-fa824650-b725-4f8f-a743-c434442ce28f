'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Gamepad2, MessageSquare, BarChart3 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGames: 0,
    totalComments: 0,
    activeUsers: 0,
  })

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // 检查是否为管理员
    if (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN') {
      toast({
        title: '权限不足',
        description: '您没有访问管理后台的权限',
        variant: 'destructive',
      })
      router.push('/')
      return
    }

    // 获取统计数据
    fetchStats()
  }, [session, status, router, toast])

  const fetchStats = async () => {
    try {
      // 这里可以调用获取统计数据的API
      // 暂时使用模拟数据
      setStats({
        totalUsers: 1234,
        totalGames: 567,
        totalComments: 890,
        activeUsers: 345,
      })
    } catch (error) {
      console.error('获取统计数据失败:', error)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">管理后台</h1>
          <p className="text-slate-600">欢迎回来，{session.user?.name}</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-2 border-slate-300 hover:shadow-2xl transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总用户数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">+12% 较上月</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-slate-300 hover:shadow-2xl transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">游戏总数</CardTitle>
              <Gamepad2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGames}</div>
              <p className="text-xs text-muted-foreground">+8% 较上月</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-slate-300 hover:shadow-2xl transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">评论总数</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalComments}</div>
              <p className="text-xs text-muted-foreground">+15% 较上月</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-slate-300 hover:shadow-2xl transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">+5% 较上月</p>
            </CardContent>
          </Card>
        </div>

        {/* 管理标签页 */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">用户管理</TabsTrigger>
            <TabsTrigger value="games">游戏管理</TabsTrigger>
            <TabsTrigger value="comments">评论管理</TabsTrigger>
            <TabsTrigger value="analytics">数据分析</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">用户管理</h2>
              <Button onClick={() => router.push('/admin/users')} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300">
                管理用户
              </Button>
            </div>
            <p className="text-slate-600">查看和管理所有用户账户</p>
          </TabsContent>

          <TabsContent value="games" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">游戏管理</h2>
              <Button onClick={() => router.push('/admin/games')} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300">
                管理游戏
              </Button>
            </div>
            <p className="text-slate-600">审核和管理社区发布的游戏</p>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">评论管理</h2>
              <Button onClick={() => router.push('/admin/comments')} className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white transition-all duration-300">
                管理评论
              </Button>
            </div>
            <p className="text-slate-600">审核和管理用户评论</p>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <h2 className="text-xl font-semibold">数据分析</h2>
            <p className="text-slate-600">查看平台使用数据和用户行为分析</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}