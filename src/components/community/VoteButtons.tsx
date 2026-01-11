'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api-client'

interface VoteButtonsProps {
  gameId: string
  initialUpvotes: number
  initialDownvotes: number
  initialUserVote?: 'UP' | 'DOWN' | null
}

export default function VoteButtons({ 
  gameId, 
  initialUpvotes, 
  initialDownvotes, 
  initialUserVote 
}: VoteButtonsProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [downvotes, setDownvotes] = useState(initialDownvotes)
  const [userVote, setUserVote] = useState<'UP' | 'DOWN' | null>(initialUserVote)
  const [isVoting, setIsVoting] = useState(false)

  const handleVote = async (voteType: 'UP' | 'DOWN') => {
    if (!session) {
      toast({
        title: '请先登录',
        description: '登录后才能进行投票',
        variant: 'destructive',
      })
      return
    }

    if (isVoting) return

    setIsVoting(true)

    try {
      const result = await apiClient.post(`/games/${gameId}/vote`, {
        type: voteType,
      })

      if (result.success) {
        // 更新本地状态
        if (userVote === voteType) {
          // 取消投票
          setUserVote(null)
          if (voteType === 'UP') {
            setUpvotes(upvotes - 1)
          } else {
            setDownvotes(downvotes - 1)
          }
        } else {
          // 新投票或改变投票
          if (userVote) {
            // 改变投票
            if (userVote === 'UP') {
              setUpvotes(upvotes - 1)
            } else {
              setDownvotes(downvotes - 1)
            }
          }
          
          setUserVote(voteType)
          if (voteType === 'UP') {
            setUpvotes(upvotes + 1)
          } else {
            setDownvotes(downvotes + 1)
          }
        }

        toast({
          title: '投票成功',
          description: voteType === 'UP' ? '已点赞' : '已点踩',
        })
      } else {
        throw new Error(result.error?.message || '投票失败')
      }
    } catch (error) {
      console.error('投票失败:', error)
      toast({
        title: '投票失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={userVote === 'UP' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleVote('UP')}
        disabled={isVoting}
        className="flex items-center gap-1"
      >
        <ThumbsUp className="h-4 w-4" />
        <span>{upvotes}</span>
      </Button>
      
      <Button
        variant={userVote === 'DOWN' ? 'destructive' : 'outline'}
        size="sm"
        onClick={() => handleVote('DOWN')}
        disabled={isVoting}
        className="flex items-center gap-1"
      >
        <ThumbsDown className="h-4 w-4" />
        <span>{downvotes}</span>
      </Button>
    </div>
  )
}