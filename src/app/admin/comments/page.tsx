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
  Trash2,
  ArrowLeft,
  User,
  MessageSquare,
  Calendar,
  Gamepad2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Comment {
  id: string
  content: string
  createdAt: string
  isDeleted: boolean
  user: {
    id: string
    name: string | null
    email: string
  }
  game: {
    id: string
    title: string
  }
}

export default function CommentManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set())

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

    fetchComments()
  }, [session, status, router, toast])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/comments')
      
      if (!response.ok) {
        throw new Error('获取评论列表失败')
      }

      const data = await response.json()
      setComments(data.comments)
    } catch (error) {
      console.error('获取评论列表失败:', error)
      toast({
        title: '错误',
        description: '获取评论列表失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCommentSelect = (commentId: string) => {
    const newSelected = new Set(selectedComments)
    if (newSelected.has(commentId)) {
      newSelected.delete(commentId)
    } else {
      newSelected.add(commentId)
    }
    setSelectedComments(newSelected)
  }

  const handleBatchDelete = async () => {
    if (selectedComments.size === 0) {
      toast({
        title: '提示',
        description: '请选择要删除的评论',
      })
      return
    }

    if (!confirm(`确定要删除选中的 ${selectedComments.size} 条评论吗？此操作不可恢复。`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/comments', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentIds: Array.from(selectedComments),
        }),
      })

      if (!response.ok) {
        throw new Error('删除评论失败')
      }

      toast({
        title: '成功',
        description: `成功删除 ${selectedComments.size} 条评论`,
      })

      setSelectedComments(new Set())
      fetchComments()
    } catch (error) {
      console.error('批量删除评论失败:', error)
      toast({
        title: '错误',
        description: '删除评论失败',
        variant: 'destructive',
      })
    }
  }

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: zhCN 
    })
  }

  const filteredComments = comments.filter(comment =>
    comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (comment.user.name && comment.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    comment.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.game.title.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-2xl font-bold text-slate-800">评论管理</h1>
          </div>
          <div className="text-sm text-slate-600">
            共 {comments.length} 条评论
          </div>
        </div>

        {/* 搜索和操作栏 */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
            <Input
              placeholder="搜索评论内容、用户或游戏..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 text-slate-800 placeholder:text-slate-400"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                const allSelected = filteredComments.length > 0 && filteredComments.every(c => selectedComments.has(c.id))
                if (allSelected) {
                  setSelectedComments(new Set())
                } else {
                  setSelectedComments(new Set(filteredComments.map(c => c.id)))
                }
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300"
            >
              {filteredComments.length > 0 && filteredComments.every(c => selectedComments.has(c.id)) ? '取消全选' : '全选'}
            </Button>
            <Button
              size="sm"
              onClick={handleBatchDelete}
              disabled={selectedComments.size === 0}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white transition-all duration-300"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              批量删除 ({selectedComments.size})
            </Button>
          </div>
        </div>

        {/* 评论列表 */}
        <Card className="bg-white border-2 border-slate-300 hover:shadow-2xl transition-all duration-200">
          <CardHeader>
            <CardTitle>评论列表</CardTitle>
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
                            setSelectedComments(new Set(filteredComments.map(c => c.id)))
                          } else {
                            setSelectedComments(new Set())
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>评论内容</TableHead>
                    <TableHead>用户</TableHead>
                    <TableHead>游戏</TableHead>
                    <TableHead>发布时间</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComments.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedComments.has(comment.id)}
                          onChange={() => handleCommentSelect(comment.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="text-sm line-clamp-3">{comment.content}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="font-medium">{comment.user.name || '匿名用户'}</div>
                          <div className="text-sm text-gray-500">{comment.user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{comment.game.title}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {formatTimeAgo(comment.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={comment.isDeleted ? 'destructive' : 'default'}>
                          {comment.isDeleted ? '已删除' : '正常'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/games/${comment.game.id}`)}
                          >
                            查看游戏
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`确定要删除这条评论吗？此操作不可恢复。`)) {
                                handleBatchDelete()
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredComments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                没有找到匹配的评论
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}