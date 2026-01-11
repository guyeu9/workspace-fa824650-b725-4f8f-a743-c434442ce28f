'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Search, 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Power,
  Edit,
  Trash2,
  ArrowLeft
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: {
    games: number
    comments: number
    votes: number
  }
}

export default function UserManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

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

    fetchUsers()
  }, [session, status, router, toast])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      
      if (!response.ok) {
        throw new Error('获取用户列表失败')
      }

      const data = await response.json()
      setUsers(data.users)
    } catch (error) {
      console.error('获取用户列表失败:', error)
      toast({
        title: '错误',
        description: '获取用户列表失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUserSelect = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const handleBatchAction = async (action: 'activate' | 'deactivate') => {
    if (selectedUsers.size === 0) {
      toast({
        title: '提示',
        description: '请选择要操作的用户',
      })
      return
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers),
          action,
        }),
      })

      if (!response.ok) {
        throw new Error('操作失败')
      }

      toast({
        title: '成功',
        description: `成功${action === 'activate' ? '激活' : '禁用'} ${selectedUsers.size} 个用户`,
      })

      setSelectedUsers(new Set())
      fetchUsers()
    } catch (error) {
      console.error('批量操作失败:', error)
      toast({
        title: '错误',
        description: '操作失败',
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

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              onClick={() => router.push('/admin')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回管理后台
            </Button>
            <h1 className="text-2xl font-bold text-slate-800">用户管理</h1>
          </div>
          <div className="text-sm text-slate-600">
            共 {users.length} 个用户
          </div>
        </div>

        {/* 搜索和操作栏 */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
            <Input
              placeholder="搜索用户邮箱或用户名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 text-slate-800 placeholder:text-slate-400"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchAction('activate')}
              disabled={selectedUsers.size === 0}
            >
              <Power className="h-4 w-4 mr-2" />
              批量激活
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchAction('deactivate')}
              disabled={selectedUsers.size === 0}
              className="text-red-600 hover:text-red-700"
            >
              <Power className="h-4 w-4 mr-2" />
              批量禁用
            </Button>
          </div>
        </div>

        {/* 用户列表 */}
        <Card>
          <CardHeader>
            <CardTitle>用户列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(new Set(filteredUsers.map(u => u.id)))
                          } else {
                            setSelectedUsers(new Set())
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>用户信息</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>统计</TableHead>
                    <TableHead>注册时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => handleUserSelect(user.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <div className="font-medium">{user.name || '未设置'}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadge(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'destructive'}>
                          {user.isActive ? '活跃' : '禁用'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          游戏: {user._count.games} | 
                          评论: {user._count.comments} | 
                          投票: {user._count.votes}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                没有找到匹配的用户
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}