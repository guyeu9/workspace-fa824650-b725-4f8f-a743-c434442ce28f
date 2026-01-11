import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// 通用测试工具函数
export const TestUtils = {
  // 等待组件加载完成
  async waitForLoading() {
    await waitFor(() => {
      expect(screen.queryByText(/加载中/i)).not.toBeInTheDocument()
    })
  },

  // 等待元素出现
  async waitForElement(text: string, timeout = 5000) {
    return waitFor(() => {
      expect(screen.getByText(text)).toBeInTheDocument()
    }, { timeout })
  },

  // 等待元素消失
  async waitForElementToDisappear(text: string, timeout = 5000) {
    return waitFor(() => {
      expect(screen.queryByText(text)).not.toBeInTheDocument()
    }, { timeout })
  },

  // 模拟用户点击
  async clickButton(text: string) {
    const button = screen.getByRole('button', { name: new RegExp(text, 'i') })
    await userEvent.click(button)
  },

  // 模拟用户输入
  async typeInput(label: string, value: string) {
    const input = screen.getByLabelText(label)
    await userEvent.clear(input)
    await userEvent.type(input, value)
  },

  // 模拟文件上传
  async uploadFile(inputLabel: string, file: File) {
    const input = screen.getByLabelText(inputLabel) as HTMLInputElement
    await userEvent.upload(input, file)
  },

  // 检查错误消息
  expectErrorMessage(message: string) {
    expect(screen.getByRole('alert')).toHaveTextContent(message)
  },

  // 检查成功消息
  expectSuccessMessage(message: string) {
    expect(screen.getByRole('status')).toHaveTextContent(message)
  },

  // 模拟API响应
  mockFetch(response: any, status = 200) {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status,
        json: () => Promise.resolve(response),
        ok: status >= 200 && status < 300,
      } as Response)
    )
  },

  // 模拟失败的API响应
  mockFetchError(message: string, status = 500) {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status,
        json: () => Promise.resolve({ error: message }),
        ok: false,
      } as Response)
    )
  },

  // 清理所有模拟
  cleanup() {
    jest.clearAllMocks()
  },
}

// 测试数据工厂
export const TestDataFactory = {
  // 创建测试用户
  createUser(overrides = {}) {
    return {
      id: 'test-user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    }
  },

  // 创建测试游戏
  createGame(overrides = {}) {
    return {
      id: 'test-game-1',
      title: 'Test Game',
      description: 'A test game',
      data: {
        metadata: {
          game_title: 'Test Game',
          branches: [],
        },
        data: {
          game_title: 'Test Game',
          branches: [],
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    }
  },

  // 创建测试评论
  createComment(overrides = {}) {
    return {
      id: 'test-comment-1',
      content: 'This is a test comment',
      userId: 'test-user-1',
      gameId: 'test-game-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    }
  },

  // 创建测试投票
  createVote(overrides = {}) {
    return {
      id: 'test-vote-1',
      type: 'UP',
      userId: 'test-user-1',
      gameId: 'test-game-1',
      createdAt: new Date().toISOString(),
      ...overrides,
    }
  },

  // 创建测试文件
  createTestFile(name: string, content: string, type: string = 'text/plain') {
    return new File([content], name, { type })
  },
}

// 性能测试工具
export const PerformanceTest = {
  // 测量组件渲染时间
  measureRenderTime(Component: React.ComponentType, props = {}) {
    const start = performance.now()
    render(<Component {...props} />)
    const end = performance.now()
    return end - start
  },

  // 测量API响应时间
  async measureApiCall(apiCall: () => Promise<any>) {
    const start = performance.now()
    const result = await apiCall()
    const end = performance.now()
    return {
      duration: end - start,
      result,
    }
  },

  // 检查内存泄漏
  checkMemoryLeak(fn: () => void, iterations = 100) {
    const initialMemory = performance.memory?.usedJSHeapSize || 0
    
    for (let i = 0; i < iterations; i++) {
      fn()
    }
    
    const finalMemory = performance.memory?.usedJSHeapSize || 0
    const memoryIncrease = finalMemory - initialMemory
    
    return {
      memoryIncrease,
      hasLeak: memoryIncrease > 1024 * 1024, // 1MB threshold
    }
  },
}
