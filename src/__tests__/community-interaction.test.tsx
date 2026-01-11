import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestUtils, TestDataFactory } from '@/lib/test-utils'
import VoteButtons from '@/components/community/VoteButtons'
import CommentsSection from '@/components/community/CommentsSection'
import { SessionProvider, useSession } from 'next-auth/react'

// 模拟API调用
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))

// 模拟 toast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
    dismiss: jest.fn(),
  }),
}))

describe('社区互动功能测试', () => {
  beforeEach(() => {
    TestUtils.cleanup()
  })

  describe('VoteButtons组件', () => {
    const mockGameId = 'test-game-1'
    const mockInitialUpvotes = 10
    const mockInitialDownvotes = 2

    it('应该正确显示初始投票数', () => {
      render(
        <VoteButtons
          gameId={mockGameId}
          initialUpvotes={mockInitialUpvotes}
          initialDownvotes={mockInitialDownvotes}
        />
      )

      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('应该显示登录提示当用户未登录时', async () => {
      const mockPost = jest.fn().mockResolvedValue({ success: false })
      require('@/lib/api-client').apiClient.post = mockPost

      const mockUseSession = jest.fn(() => ({
        data: null,
        status: 'unauthenticated',
      }))
      jest.spyOn(require('next-auth/react'), 'useSession').mockImplementation(mockUseSession)

      const mockToast = jest.fn()
      jest.spyOn(require('@/hooks/use-toast'), 'useToast').mockReturnValue({
        toast: mockToast,
        dismiss: jest.fn(),
      })

      render(
        <VoteButtons
          gameId={mockGameId}
          initialUpvotes={mockInitialUpvotes}
          initialDownvotes={mockInitialDownvotes}
        />
      )

      const upvoteButton = screen.getByRole('button', { name: `${mockInitialUpvotes}` })
      await userEvent.click(upvoteButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '请先登录',
            description: '登录后才能进行投票',
            variant: 'destructive',
          })
        )
      })
    })

    it('应该正确处理投票逻辑', async () => {
      const mockPost = jest.fn().mockResolvedValue({ success: true })
      require('@/lib/api-client').apiClient.post = mockPost

      const mockSession = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        status: 'authenticated',
      }

      const mockUseSession = jest.fn(() => ({
        data: mockSession,
        status: 'authenticated',
      }))
      jest.spyOn(require('next-auth/react'), 'useSession').mockImplementation(mockUseSession)

      const mockToast = jest.fn()
      jest.spyOn(require('@/hooks/use-toast'), 'useToast').mockReturnValue({
        toast: mockToast,
        dismiss: jest.fn(),
      })

      render(
        <SessionProvider session={mockSession}>
          <VoteButtons
            gameId={mockGameId}
            initialUpvotes={mockInitialUpvotes}
            initialDownvotes={mockInitialDownvotes}
          />
        </SessionProvider>
      )

      const upvoteButton = screen.getByRole('button', { name: `${mockInitialUpvotes}` })
      await userEvent.click(upvoteButton)

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith(`/games/${mockGameId}/vote`, {
          type: 'UP',
        })
        expect(screen.getByText('11')).toBeInTheDocument() // 投票数应该增加
      })
    })

    it('应该正确处理取消投票', async () => {
      const mockPost = jest.fn().mockResolvedValue({ success: true })
      require('@/lib/api-client').apiClient.post = mockPost

      const mockSession = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        status: 'authenticated',
      }

      const mockUseSession = jest.fn(() => ({
        data: mockSession,
        status: 'authenticated',
      }))
      jest.spyOn(require('next-auth/react'), 'useSession').mockImplementation(mockUseSession)

      const mockToast = jest.fn()
      jest.spyOn(require('@/hooks/use-toast'), 'useToast').mockReturnValue({
        toast: mockToast,
        dismiss: jest.fn(),
      })

      render(
        <SessionProvider session={mockSession}>
          <VoteButtons
            gameId={mockGameId}
            initialUpvotes={mockInitialUpvotes}
            initialDownvotes={mockInitialDownvotes}
            initialUserVote="UP"
          />
        </SessionProvider>
      )

      const upvoteButton = screen.getByRole('button', { name: `${mockInitialUpvotes}` })
      await userEvent.click(upvoteButton)

      await waitFor(() => {
        expect(screen.getByText('9')).toBeInTheDocument() // 投票数应该减少
      })
    })
  })

  describe('CommentsSection组件', () => {
    const mockGameId = 'test-game-1'
    const mockComments = [
      TestDataFactory.createComment({
        id: '1',
        content: 'Great game!',
        user: { name: 'User1', email: 'user1@example.com' },
      }),
      TestDataFactory.createComment({
        id: '2',
        content: 'Love this game!',
        user: { name: 'User2', email: 'user2@example.com' },
      }),
    ]

    beforeEach(() => {
      const mockGet = jest.fn().mockResolvedValue({
        success: true,
        data: { items: mockComments },
      })
      require('@/lib/api-client').apiClient.get = mockGet
    })

    it('应该正确显示评论列表', async () => {
      render(
        <SessionProvider session={null}>
          <CommentsSection gameId={mockGameId} />
        </SessionProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Great game!')).toBeInTheDocument()
        expect(screen.getByText('Love this game!')).toBeInTheDocument()
      })
    })

    it('应该显示登录提示当用户未登录时', async () => {
      const mockUseSession = jest.fn(() => ({
        data: null,
        status: 'unauthenticated',
      }))
      jest.spyOn(require('next-auth/react'), 'useSession').mockImplementation(mockUseSession)

      render(
        <SessionProvider session={null}>
          <CommentsSection gameId={mockGameId} />
        </SessionProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('请登录后发表评论')).toBeInTheDocument()
      })
    })

    it('应该正确处理评论发表', async () => {
      const mockPost = jest.fn().mockResolvedValue({
        success: true,
        data: TestDataFactory.createComment({
          content: 'New comment',
          user: { name: 'Test User', email: 'test@example.com' },
        }),
      })
      require('@/lib/api-client').apiClient.post = mockPost

      const mockSession = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        status: 'authenticated',
      }

      const mockUseSession = jest.fn(() => ({
        data: mockSession,
        status: 'authenticated',
      }))
      jest.spyOn(require('next-auth/react'), 'useSession').mockImplementation(mockUseSession)

      render(
        <SessionProvider session={mockSession}>
          <CommentsSection gameId={mockGameId} />
        </SessionProvider>
      )

      const textarea = screen.getByPlaceholderText('写下您的评论...')
      const submitButton = screen.getByRole('button', { name: /发表评论/i })

      await userEvent.type(textarea, 'New comment')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith(`/games/${mockGameId}/comments`, {
          content: 'New comment',
        })
        expect(screen.getByText('New comment')).toBeInTheDocument()
      })
    })

    it('应该显示错误消息当评论发表失败时', async () => {
      const mockPost = jest.fn().mockResolvedValue({
        success: false,
        error: { message: '发表失败' },
      })
      require('@/lib/api-client').apiClient.post = mockPost

      const mockSession = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        status: 'authenticated',
      }

      const mockUseSession = jest.fn(() => ({
        data: mockSession,
        status: 'authenticated',
      }))
      jest.spyOn(require('next-auth/react'), 'useSession').mockImplementation(mockUseSession)

      const mockToast = jest.fn()
      jest.spyOn(require('@/hooks/use-toast'), 'useToast').mockReturnValue({
        toast: mockToast,
        dismiss: jest.fn(),
      })

      render(
        <SessionProvider session={mockSession}>
          <CommentsSection gameId={mockGameId} />
        </SessionProvider>
      )

      const textarea = screen.getByPlaceholderText('写下您的评论...')
      const submitButton = screen.getByRole('button', { name: /发表评论/i })

      await userEvent.type(textarea, 'New comment')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '发表评论失败',
            description: '发表失败',
            variant: 'destructive',
          })
        )
      })
    })

    it('应该验证评论内容不为空', async () => {
      const mockSession = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        status: 'authenticated',
      }

      const mockUseSession = jest.fn(() => ({
        data: mockSession,
        status: 'authenticated',
      }))
      jest.spyOn(require('next-auth/react'), 'useSession').mockImplementation(mockUseSession)

      const mockToast = jest.fn()
      jest.spyOn(require('@/hooks/use-toast'), 'useToast').mockReturnValue({
        toast: mockToast,
        dismiss: jest.fn(),
      })

      render(
        <SessionProvider session={mockSession}>
          <CommentsSection gameId={mockGameId} />
        </SessionProvider>
      )

      const submitButton = screen.getByRole('button', { name: /发表评论/i })
      
      expect(submitButton).toBeDisabled()

      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(mockToast).not.toHaveBeenCalled()
      })
    })
  })

  describe('性能测试', () => {
    const mockGameId = 'test-game-1'

    it('应该快速渲染大量评论', () => {
      const manyComments = Array.from({ length: 100 }, (_, i) =>
        TestDataFactory.createComment({
          id: `${i}`,
          content: `Comment ${i}`,
          user: { name: `User${i}`, email: `user${i}@example.com` },
        })
      )

      const mockGet = jest.fn().mockResolvedValue({
        success: true,
        data: { items: manyComments },
      })
      require('@/lib/api-client').apiClient.get = mockGet

      const mockUseSession = jest.fn(() => ({
        data: null,
        status: 'unauthenticated',
      }))
      jest.spyOn(require('next-auth/react'), 'useSession').mockImplementation(mockUseSession)

      const startTime = performance.now()
      
      render(
        <SessionProvider session={null}>
          <CommentsSection gameId={mockGameId} />
        </SessionProvider>
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      expect(renderTime).toBeLessThan(1000) // 渲染时间应该小于1秒
    })

    it('应该正确处理快速连续点击', async () => {
      const mockPost = jest.fn().mockResolvedValue({
        success: true,
        data: TestDataFactory.createComment({
          content: 'New comment',
          user: { name: 'Test User', email: 'test@example.com' },
        }),
      })
      require('@/lib/api-client').apiClient.post = mockPost

      const mockSession = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        status: 'authenticated',
      }

      const mockUseSession = jest.fn(() => ({
        data: mockSession,
        status: 'authenticated',
      }))
      jest.spyOn(require('next-auth/react'), 'useSession').mockImplementation(mockUseSession)

      render(
        <SessionProvider session={mockSession}>
          <CommentsSection gameId={mockGameId} />
        </SessionProvider>
      )

      const submitButton = screen.getByRole('button', { name: /发表评论/i })

      // 快速连续点击10次
      for (let i = 0; i < 10; i++) {
        await userEvent.click(submitButton)
      }

      // 应该只调用一次（因为内容为空）
      expect(mockPost).not.toHaveBeenCalled()
    })
  })
})