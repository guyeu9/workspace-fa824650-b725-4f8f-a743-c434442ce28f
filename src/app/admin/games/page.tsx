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
  Gamepad2,
  User,
  Calendar,
  MessageSquare,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Game {
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
  _count: {
    votes: number
    comments: number
  }
}

export default function GameManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set())

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

    fetchGames()
  }, [session, status, router, toast])

  const fetchGames = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/games')
      
      if (!response.ok) {
        throw new Error('获取游戏列表失败')
      }

      const data = await response.json()
      setGames(data.games)
    } catch (error) {
      console.error('获取游戏列表失败:', error)
      toast({
        title: '错误',
        description: '获取游戏列表失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGameSelect = (gameId: string) => {
    const newSelected = new Set(selectedGames)
    if (newSelected.has(gameId)) {
      newSelected.delete(gameId)
    } else {
      newSelected.add(gameId)
    }
    setSelectedGames(newSelected)
  }

  const handleBatchDelete = async () => {
    if (selectedGames.size === 0) {
      toast({
        title: '提示',
        description: '请选择要删除的游戏',
      })
      return
    }

    if (!confirm(`确定要删除选中的 ${selectedGames.size} 个游戏吗？此操作不可恢复。`)) {
      return
    }

    try {
      // 批量删除游戏
      for (const gameId of selectedGames) {
        const response = await fetch(`/api/admin/games?id=${gameId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error(`删除游戏 ${gameId} 失败`)
        }
      }

      toast({
        title: '成功',
        description: `成功删除 ${selectedGames.size} 个游戏`,
      })

      setSelectedGames(new Set())
      fetchGames()
    } catch (error) {
      console.error('批量删除游戏失败:', error)
      toast({
        title: '错误',
        description: '删除游戏失败',
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

  const filteredGames = games.filter(game =>
    game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (game.description && game.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (game.author.name && game.author.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    game.author.email.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-2xl font-bold text-slate-800">游戏管理</h1>
          </div>
          <div className="text-sm text-slate-600">
            共 {games.length} 个游戏
          </div>
        </div>

        {/* 搜索和操作栏 */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
            <Input
              placeholder="搜索游戏标题、描述或作者..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 text-slate-800 placeholder:text-slate-400"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                const allSelected = filteredGames.length > 0 && filteredGames.every(g => selectedGames.has(g.id))
                if (allSelected) {
                  setSelectedGames(new Set())
                } else {
                  setSelectedGames(new Set(filteredGames.map(g => g.id)))
                }
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300"
            >
              {filteredGames.length > 0 && filteredGames.every(g => selectedGames.has(g.id)) ? '取消全选' : '全选'}
            </Button>
            <Button
              size="sm"
              onClick={handleBatchDelete}
              disabled={selectedGames.size === 0}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white transition-all duration-300"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              批量删除 ({selectedGames.size})
            </Button>
          </div>
        </div>

        {/* 游戏列表 */}
        <Card className="bg-white border-2 border-slate-300 hover:shadow-2xl transition-all duration-200">
          <CardHeader>
            <CardTitle>游戏列表</CardTitle>
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
                            setSelectedGames(new Set(filteredGames.map(g => g.id)))
                          } else {
                            setSelectedGames(new Set())
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>游戏信息</TableHead>
                    <TableHead>作者</TableHead>
                    <TableHead>互动统计</TableHead>
                    <TableHead>发布时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGames.map((game) => (
                    <TableRow key={game.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedGames.has(game.id)}
                          onChange={() => handleGameSelect(game.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {game.coverUrl && (
                            <img
                              src={game.coverUrl}
                              alt={game.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex flex-col">
                            <div className="font-medium">{game.title}</div>
                            {game.description && (
                              <div className="text-sm text-gray-500 line-clamp-2">
                                {game.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="font-medium">{game.author.name || '匿名'}</div>
                          <div className="text-sm text-gray-500">{game.author.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {game._count.votes}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {game._count.comments}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {formatTimeAgo(game.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/games/${game.id}`)}
                          >
                            查看
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`确定要删除游戏 "${game.title}" 吗？此操作不可恢复。`)) {
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
            
            {filteredGames.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                没有找到匹配的游戏
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}