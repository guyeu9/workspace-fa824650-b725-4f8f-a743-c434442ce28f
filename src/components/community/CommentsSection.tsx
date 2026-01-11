'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { MessageSquare, Send, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { apiClient } from '@/lib/api-client'
import { CommentCardSkeleton } from '@/components/ui/skeletons'

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface CommentsSectionProps {
  gameId: string
}

export default function CommentsSection({ gameId }: CommentsSectionProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [gameId])

  const fetchComments = async () => {
    try {
      setIsLoading(true)
      const result = await apiClient.get(`/games/${gameId}/comments`)
      
      if (result.success) {
        setComments(result.data.items || [])
      } else {
        throw new Error(result.error?.message || '获取评论失败')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取评论失败';
      console.error('获取评论失败:', error)
      toast({
        title: '获取评论失败',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!session) {
      toast({
        title: '请先登录',
        description: '登录后才能发表评论',
        variant: 'destructive',
      })
      return
    }

    if (!newComment.trim()) {
      toast({
        title: '请输入评论内容',
        description: '评论内容不能为空',
        variant: 'destructive',
      })
      return
    }

    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      const result = await apiClient.post(`/games/${gameId}/comments`, {
        content: newComment.trim(),
      })

      if (result.success) {
        setComments([result.data, ...comments])
        setNewComment('')

        toast({
          title: '评论发表成功',
          description: '您的评论已发布',
        })
      } else {
        throw new Error(result.error?.message || '发表评论失败')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '发表评论失败';
      console.error('发表评论失败:', error)
      toast({
        title: '发表评论失败',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
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

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          评论 ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 评论输入框 */}
        {session && (
          <div className="mb-6">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {getInitials(session.user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="写下您的评论..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitComment}
                    disabled={isSubmitting || !newComment.trim()}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    发表评论
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!session && (
          <div className="text-center py-6 text-gray-500">
            <User className="h-8 w-8 mx-auto mb-2" />
            <p>请登录后发表评论</p>
          </div>
        )}

        {/* 评论列表 */}
        {isLoading ? (
          <div className="space-y-4">
            <CommentCardSkeleton count={3} />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无评论，快来发表第一条评论吧！
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {getInitials(comment.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {comment.user.name || '匿名用户'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">
                    {comment.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}