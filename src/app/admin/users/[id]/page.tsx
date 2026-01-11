'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Shield,
  Power,
  Edit,
  Save,
  X
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface UserDetail {
  user: {
    id: string
    email: string
    name: string | null
    role: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
  stats: {
    gamesCount: number
    commentsCount: number
    votesCount: number
    loginCount: number
  }
  games: Array<{
    id: string
    title: string
    createdAt: string
    updatedAt: string
  }>
  comments: Array<{
    id: string
    content: string
    createdAt: string
    game: {
      id: string
      title: string
    }
  }>
  votes: Array<{
    id: string
    type: 'UP' | 'DOWN'
    createdAt: string
    game: {
      id: string
      title: string
    }
  }>
  loginRecords: Array<{
    id: string
    ipAddress: string | null
    userAgent: string | null
    createdAt: string
  }>
  onlineStats: {
    totalOnlineTime: number
    lastLoginAt: string | null
    lastLogoutAt: string | null
  } | null
}

export default function UserDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    role: '',
    isActive: true
  })

  const userId = params.id as string

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

    fetchUserDetail()
  }, [session, status, router, toast, userId])

  const fetchUserDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users/${userId}`)
      
      if (!response.ok) {
        throw new Error('获取用户详情失败')
      }

      const data = await response.json()
      setUserDetail(data)
      setEditForm({
        name: data.user.name || '',
        role: data.user.role,
        isActive: data.user.isActive
      })
    } catch (error) {
      console.error('获取用户详情失败:', error)
      toast({
        title: '错误',
        description: '获取用户详情失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        throw new Error('更新失败')
      }

      toast({
        title: '成功',
        description: '用户信息更新成功',
      })

      setEditing(false)
      fetchUserDetail()
    } catch (error) {
      console.error('更新用户信息失败:', error)
      toast({
        title: '错误',
        description: '更新用户信息失败',
        variant: 'destructive',
      })
    }
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      USER: 'bg-blue-100 text-blue-800',
      ADMIN: 'bg-yellow-100 text-yellow-800',
      SUPER_ADMIN: 'bg-red-100 text-red-800',
    }
    return variants[role as keyof typeof variants] || 'bg-gray-100 text-gray-800'
  }

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: zhCN 
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  if (!userDetail) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 顶部导航 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              onClick={() => router.push('/admin/users')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回用户列表
            </Button>
            <h1 className="text-2xl font-bold text-slate-800">用户详情</h1>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button
                  size="sm"
                  onClick={() => setEditing(false)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300"
                >
                  <X className="h-4 w-4 mr-2" />
                  取消
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white transition-all duration-300"
                >
                  <Save className="h-4 w-4 mr-2" />
                  保存
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => setEditing(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300"
              >
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 基本信息 */}
          <div className="lg:col-span-1">
            <Card className="bg-white border-2 border-slate-300 hover:shadow-2xl transition-all duration-200">
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>用户名</Label>
                  {editing ? (
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      placeholder="请输入用户名"
                      className="bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 text-slate-800 placeholder:text-slate-400"
                    />
                  ) : (
                    <div className="text-lg font-medium">{userDetail.user.name || '未设置'}</div>
                  )}
                </div>
                
                <div>
                  <Label>邮箱</Label>
                  <div className="text-lg">{userDetail.user.email}</div>
                </div>

                <div>
                  <Label>角色</Label>
                  {editing ? (
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                      className="w-full px-3 py-2 border border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 text-slate-800 bg-white rounded-lg"
                    >
                      <option value="USER">普通用户</option>
                      <option value="ADMIN">管理员</option>
                      <option value="SUPER_ADMIN">超级管理员</option>
                    </select>
                  ) : (
                    <Badge className={getRoleBadge(userDetail.user.role)}>
                      {userDetail.user.role}
                    </Badge>
                  )}
                </div>

                <div>
                  <Label>状态</Label>
                  {editing ? (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editForm.isActive}
                        onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})}
                        className="w-4 h-4 rounded border-blue-300 text-blue-500 focus:ring-blue-500/20"
                      />
                      激活状态
                    </label>
                  ) : (
                    <Badge variant={userDetail.user.isActive ? 'default' : 'destructive'}>
                      {userDetail.user.isActive ? '活跃' : '禁用'}
                    </Badge>
                  )}
                </div>

                <div>
                  <Label>注册时间</Label>
                  <div className="text-sm text-slate-600">
                    {new Date(userDetail.user.createdAt).toLocaleString()}
                  </div>
                </div>

                <div>
                  <Label>最后更新</Label>
                  <div className="text-sm text-slate-600">
                    {formatTimeAgo(userDetail.user.updatedAt)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 统计数据 */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{userDetail.stats.gamesCount}</div>
                  <div className="text-sm">游戏数量</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{userDetail.stats.commentsCount}</div>
                  <div className="text-sm">评论数量</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{userDetail.stats.votesCount}</div>
                  <div className="text-sm">投票数量</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{userDetail.stats.loginCount}</div>
                  <div className="text-sm">登录次数</div>
                </CardContent>
              </Card>
            </div>

            {/* 最近活动 */}
            <div className="space-y-6">
              {/* 最近游戏 */}
              <Card className="bg-white border-2 border-slate-300 hover:shadow-2xl transition-all duration-200">
                <CardHeader>
                  <CardTitle>最近发布的游戏</CardTitle>
                </CardHeader>
                <CardContent>
                  {userDetail.games.length === 0 ? (
                    <div className="text-slate-500 text-center py-4">暂无游戏</div>
                  ) : (
                    <div className="space-y-2">
                      {userDetail.games.slice(0, 5).map((game) => (
                        <div key={game.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                          <div>
                            <div className="font-medium text-slate-800">{game.title}</div>
                            <div className="text-sm text-slate-600">
                              {formatTimeAgo(game.createdAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 最近评论 */}
              <Card className="bg-white border-2 border-slate-300 hover:shadow-2xl transition-all duration-200">
                <CardHeader>
                  <CardTitle>最近评论</CardTitle>
                </CardHeader>
                <CardContent>
                  {userDetail.comments.length === 0 ? (
                    <div className="text-slate-500 text-center py-4">暂无评论</div>
                  ) : (
                    <div className="space-y-2">
                      {userDetail.comments.slice(0, 5).map((comment) => (
                        <div key={comment.id} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-medium text-sm text-slate-800">{comment.game.title}</div>
                            <div className="text-xs text-slate-600">
                              {formatTimeAgo(comment.createdAt)}
                            </div>
                          </div>
                          <div className="text-sm text-slate-700 line-clamp-2">
                            {comment.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 最近投票 */}
              <Card className="bg-white border-2 border-slate-300 hover:shadow-2xl transition-all duration-200">
                <CardHeader>
                  <CardTitle>最近投票</CardTitle>
                </CardHeader>
                <CardContent>
                  {userDetail.votes.length === 0 ? (
                    <div className="text-slate-500 text-center py-4">暂无投票</div>
                  ) : (
                    <div className="space-y-2">
                      {userDetail.votes.slice(0, 5).map((vote) => (
                        <div key={vote.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                          <div className="font-medium text-slate-800">{vote.game.title}</div>
                          <div className="flex items-center gap-2">
                            <Badge variant={vote.type === 'UP' ? 'default' : 'destructive'}>
                              {vote.type === 'UP' ? '👍' : '👎'}
                            </Badge>
                            <div className="text-sm text-slate-600">
                              {formatTimeAgo(vote.createdAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 登录记录 */}
              <Card className="bg-white border-2 border-slate-300 hover:shadow-2xl transition-all duration-200">
                <CardHeader>
                  <CardTitle>最近登录记录</CardTitle>
                </CardHeader>
                <CardContent>
                  {userDetail.loginRecords.length === 0 ? (
                    <div className="text-slate-500 text-center py-4">暂无登录记录</div>
                  ) : (
                    <div className="space-y-2">
                      {userDetail.loginRecords.slice(0, 10).map((record) => (
                        <div key={record.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                          <div>
                            <div className="text-sm text-slate-800">IP: {record.ipAddress || '未知'}</div>
                            <div className="text-xs text-slate-600">
                              {new Date(record.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}