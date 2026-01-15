'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { IconSave, IconLoad, IconDelete, IconClose, IconHome, IconBox } from '../icons'
import { gameStore } from '@/lib/game-store'
import { toast } from 'sonner'
import Link from 'next/link'
import { LayoutTemplate } from 'lucide-react'
import { PlatformFileDownloader } from '@/lib/platform-file-download'
import { PlatformFileUploader } from '@/lib/platform-file-upload'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Choice {
  id: string
  choice: string
  next_branch: string
  effect?: string
  status_update?: string
  status_changes?: StatusChange[]
  end_game?: boolean
}

interface StatusChange {
  attribute: string
  operation: '+' | '-' | '*' | '/' | '='
  value: number
  min?: number
  max?: number
}

interface GameStateConfig {
  name: string
  initial_value: number
  min?: number
  max?: number
  is_percentage?: boolean
}

interface Branch {
  branch_id: string
  chapter: string
  scene_detail: string
  choices: Choice[]
  background_image?: string
  background_asset_id?: string
}

interface GameData {
  game_title: string
  description: string
  status?: string
  game_states?: GameStateConfig[]
  branches: Branch[]
}

export default function GameEditor() {
  const [gameData, setGameData] = useState<GameData>({
    game_title: '我的故事',
    description: '这是一个精彩的故事...',
    branches: []
  })
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('')
  const [backgroundAssetId, setBackgroundAssetId] = useState<string>('')
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [history, setHistory] = useState<GameData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showPreview, setShowPreview] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentStep, setCurrentStep] = useState(1)

  // 步骤引导：1-基础信息 2-创建分支 3-编辑分支 4-添加选项 5-完成
  const steps = [
    { id: 1, title: '基础信息', description: '填写游戏标题和描述' },
    { id: 2, title: '创建分支', description: '添加故事场景分支' },
    { id: 3, title: '编辑分支', description: '设置场景内容和背景' },
    { id: 4, title: '添加选项', description: '为分支添加选择选项' },
    { id: 5, title: '完成', description: '测试和导出游戏' }
  ]

  const saveToHistory = (data: GameData) => {
    // 限制历史记录数量，最多保存50条
    const MAX_HISTORY = 50;
    const newHistory = history.slice(0, historyIndex + 1);
    
    // 使用更高效的深拷贝方式
    const clonedData = structuredClone(data);
    newHistory.push(clonedData);
    
    // 如果历史记录超过限制，移除最旧的记录
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
      setHistoryIndex(newHistory.length - 1);
    }
    
    setHistory(newHistory);
  }

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setGameData(JSON.parse(JSON.stringify(history[newIndex])))
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setGameData(JSON.parse(JSON.stringify(history[newIndex])))
    }
  }

  const addBranch = () => {
    const newBranch: Branch = {
      branch_id: `branch_${Date.now()}`,
      chapter: '新章节',
      scene_detail: '在这里输入场景描述...',
      choices: []
    }
    const newData = {
      ...gameData,
      branches: [...gameData.branches, newBranch]
    }
    setGameData(newData)
    setSelectedBranchId(newBranch.branch_id)
    saveToHistory(newData)
  }

  const deleteBranch = (branchId: string) => {
    const newData = {
      ...gameData,
      branches: gameData.branches.filter(b => b.branch_id !== branchId)
    }
    setGameData(newData)
    if (selectedBranchId === branchId) {
      setSelectedBranchId('')
    }
    saveToHistory(newData)
  }

  const updateBranch = (branchId: string, field: keyof Branch, value: any) => {
    const newData = {
      ...gameData,
      branches: gameData.branches.map(b => 
        b.branch_id === branchId ? { ...b, [field]: value } : b
      )
    }
    setGameData(newData)
    saveToHistory(newData)
  }

  const addChoice = (branchId: string) => {
    const newChoice: Choice = {
      id: `choice_${Date.now()}`,
      choice: '新选项',
      next_branch: '',
      end_game: false
    }
    const newData = {
      ...gameData,
      branches: gameData.branches.map(b => 
        b.branch_id === branchId 
          ? { ...b, choices: [...b.choices, newChoice] }
          : b
      )
    }
    setGameData(newData)
    saveToHistory(newData)
  }

  const updateChoice = (branchId: string, choiceId: string, field: keyof Choice, value: any) => {
    const newData = {
      ...gameData,
      branches: gameData.branches.map(b => 
        b.branch_id === branchId 
          ? {
              ...b,
              choices: b.choices.map(c => 
                c.id === choiceId ? { ...c, [field]: value } : c
              )
            }
          : b
      )
    }
    setGameData(newData)
    saveToHistory(newData)
  }

  const deleteChoice = (branchId: string, choiceId: string) => {
    const newData = {
      ...gameData,
      branches: gameData.branches.map(b => 
        b.branch_id === branchId 
          ? { ...b, choices: b.choices.filter(c => c.id !== choiceId) }
          : b
      )
    }
    setGameData(newData)
    saveToHistory(newData)
  }

  const exportJson = async () => {
    try {
      const result = await PlatformFileDownloader.downloadJson(
        `${gameData.game_title}.json`,
        gameData,
        {
          onProgress: (progress) => {
            console.log(`导出进度: ${progress}%`)
          },
          onSuccess: () => {
            toast.success('游戏导出成功！')
          },
          onError: (error) => {
            toast.error(`导出失败: ${error.message}`)
          }
        }
      )
    } catch (error) {
      console.error('导出游戏失败:', error)
      toast.error('导出游戏失败')
    }
  }

  const importJson = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      if (data.game_title && data.branches && Array.isArray(data.branches)) {
        const processedData = {
          ...data,
          branches: data.branches.map((branch: any) => ({
            ...branch,
            choices: branch.choices.map((choice: any) => ({
              ...choice,
              id: choice.id || `choice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }))
          }))
        }
        setGameData(processedData)
        if (processedData.background_image) {
          setBackgroundImageUrl(processedData.background_image)
        }
        if (processedData.background_asset_id) {
          setBackgroundAssetId(processedData.background_asset_id)
        }
        saveToHistory(processedData)
        toast.success('导入成功！')
      } else {
        toast.error('无效的游戏文件格式')
      }
    } catch (error) {
      console.error('导入游戏失败:', error)
      toast.error('导入游戏失败')
    }
  }

  const startGame = () => {
    // 保存游戏到IndexedDB
    if (gameData.game_title && gameData.game_title !== '我的故事') {
      gameStore.createGame(gameData.game_title, {
        ...gameData,
        background_image: backgroundImageUrl,
        background_asset_id: backgroundAssetId
      }, {
        description: gameData.description,
        author: 'Unknown'
      }).then(() => {
        toast.success('游戏已保存到游戏库！')
      }).catch(error => {
        console.error('保存游戏失败:', error)
      })
    }
    
    // 设置游戏数据并跳转
    const gameDataWithBg = {
      ...gameData,
      background_image: backgroundImageUrl,
      background_asset_id: backgroundAssetId
    }
    sessionStorage.setItem('gameData', JSON.stringify(gameDataWithBg))
    window.location.href = '/'
  }

  const selectedBranch = gameData.branches.find(b => b.branch_id === selectedBranchId)

  interface NodePosition {
    id: string
    x: number
    y: number
  }

  const [nodePositions, setNodePositions] = useState<NodePosition[]>([])
  const [visibleNodes, setVisibleNodes] = useState<NodePosition[]>([])
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null)
  const graphRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (gameData.branches.length === 0) {
      setNodePositions([])
      return
    }

    const positions: NodePosition[] = []
    const centerX = 400
    const centerY = 300
    const levelHeight = 200
    const nodeWidth = 200
    const horizontalSpacing = 250

    const processedNodes = new Set<string>()
    const nodesByLevel: Map<number, string[]> = new Map()

    const processNode = (branchId: string, level: number) => {
      if (processedNodes.has(branchId)) return
      processedNodes.add(branchId)

      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, [])
      }
      nodesByLevel.get(level)!.push(branchId)

      const branch = gameData.branches.find(b => b.branch_id === branchId)
      if (branch) {
        branch.choices.forEach(choice => {
          if (choice.next_branch && !processedNodes.has(choice.next_branch)) {
            processNode(choice.next_branch, level + 1)
          }
        })
      }
    }

    const startBranch = gameData.branches[0]
    if (startBranch) {
      processNode(startBranch.branch_id, 0)
    }

    nodesByLevel.forEach((nodeIds, level) => {
      const levelWidth = nodeIds.length * horizontalSpacing
      const startX = centerX - levelWidth / 2 + horizontalSpacing / 2

      nodeIds.forEach((branchId, index) => {
        positions.push({
          id: branchId,
          x: startX + index * horizontalSpacing,
          y: centerY + level * levelHeight
        })
      })
    })

    setNodePositions(positions)
  }, [gameData.branches])

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(prev => Math.max(0.3, Math.min(3, prev * delta)))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const getNodePosition = (branchId: string) => {
    return nodePositions.find(pos => pos.id === branchId)
  }

  const getVisibleNodes = useCallback(() => {
    const container = graphRef.current
    if (!container || nodePositions.length === 0) return nodePositions

    const rect = container.getBoundingClientRect()
    const padding = 200

    const visibleArea = {
      x: (-pan.x / scale) - padding,
      y: (-pan.y / scale) - padding,
      width: (rect.width / scale) + padding * 2,
      height: (rect.height / scale) + padding * 2
    }

    return nodePositions.filter(pos =>
      pos.x >= visibleArea.x &&
      pos.x <= visibleArea.x + visibleArea.width &&
      pos.y >= visibleArea.y &&
      pos.y <= visibleArea.y + visibleArea.height
    )
  }, [nodePositions, pan, scale])

  useEffect(() => {
    const updateVisibleNodes = () => {
      const visible = getVisibleNodes()
      setVisibleNodes(visible)
    }

    requestAnimationFrame(updateVisibleNodes)
  }, [nodePositions, pan, scale, getVisibleNodes])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-red-50/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400/5 via-red-400/5 to-pink-400/5 backdrop-blur-sm"></div>
      
      <div className="relative z-10">
        <div className="bg-white/90 backdrop-blur-xl border-b border-white/50 sticky top-0 z-10 shadow-lg shadow-orange-500/5 pt-[env(safe-area-inset-top)]">
          <div className="px-3 sm:px-5 lg:px-7 py-3 sm:py-4 lg:py-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 lg:gap-4">
              <h1 className="text-base sm:text-xl lg:text-3xl font-extrabold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent tracking-tight flex items-center gap-1 sm:gap-1.5 lg:gap-2 whitespace-nowrap">
                <Link href="/" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive shadow-xs hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 flex items-center gap-2">
                  <IconHome className="h-4 w-4" />
                  首页
                </Link>
                <span className="text-base sm:text-xl lg:text-3xl">📝</span>
                <span>文本游戏制作</span>
                <Link href="/studio">
                  <button className="ml-4 inline-flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-300 shadow-md">
                    <LayoutTemplate className="w-4 h-4" />
                    新版编辑器 (Studio)
                  </button>
                </Link>
              </h1>
              
              <div className="flex flex-nowrap gap-2 sm:gap-2 lg:gap-3 items-center justify-center w-full sm:w-auto">
                <div className="relative">
                  <button
                    onClick={async () => {
                      const result = await PlatformFileUploader.uploadJson()
                      if (result.success && result.file) {
                        setPendingImportFile(result.file)
                      }
                    }}
                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white transition-all duration-300 font-bold px-3 sm:px-4 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg text-xs sm:text-sm lg:text-sm flex items-center gap-1 sm:gap-1.5 lg:gap-1.5 cursor-pointer shadow-sm hover:shadow-md active:scale-95 min-w-[90px] h-[44px] sm:h-auto justify-center"
                  >
                    <span className="inline">导入</span>
                  </button>
                </div>

                {/* 导入确认弹窗 */}
                <AlertDialog open={!!pendingImportFile} onOpenChange={(open) => {
                  if (!open) setPendingImportFile(null)
                }}>
                  <AlertDialogContent className="max-w-md bg-white/100 backdrop-blur-none">
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认导入游戏</AlertDialogTitle>
                      <AlertDialogDescription>
                        导入新游戏将覆盖当前编辑的游戏内容（{gameData.branches.length} 个分支）。此操作不可撤销，请确认是否继续？
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex justify-end gap-3 mt-4">
                      <AlertDialogCancel asChild>
                        <button
                          onClick={() => setPendingImportFile(null)}
                          className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all"
                        >
                          取消
                        </button>
                      </AlertDialogCancel>
                      <button
                        onClick={async () => {
                          if (pendingImportFile) {
                            await importJson(pendingImportFile)
                            setPendingImportFile(null)
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                      >
                        确认导入
                      </button>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
                
                <button
                  onClick={exportJson}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 font-bold px-3 sm:px-4 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg text-xs sm:text-sm lg:text-sm flex items-center gap-1 sm:gap-1.5 lg:gap-1.5 shadow-sm hover:shadow-md active:scale-95 min-w-[90px] h-[44px] sm:h-auto justify-center"
                >
                  <span className="inline">导出</span>
                </button>
                
                <button
                  onClick={async () => {
                    if (gameData.game_title && gameData.game_title !== '我的故事') {
                      try {
                        await gameStore.createGame(gameData.game_title, {
                          ...gameData,
                          background_image: backgroundImageUrl,
                          background_asset_id: backgroundAssetId
                        }, {
                          description: gameData.description,
                        })
                        toast.success(`${gameData.game_title}`, {
                          description: '已成功保存到游戏库',
                          duration: 3000,
                        })
                      } catch (error) {
                        console.error('保存游戏失败:', error)
                        toast.error('保存游戏失败', {
                          description: '请稍后重试',
                          duration: 4000,
                        })
                      }
                    } else {
                      toast.error('请先设置游戏标题', {
                        description: '需要在左侧设置游戏标题后才能保存',
                        duration: 4000,
                      })
                    }
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300 font-bold px-3 sm:px-4 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg text-xs sm:text-sm lg:text-sm flex items-center gap-1 sm:gap-1.5 lg:gap-1.5 shadow-sm hover:shadow-md active:scale-95 min-w-[90px] h-[44px] sm:h-auto justify-center"
                >
                  <span className="inline">保存</span>
                </button>
                
                <button
                  onClick={startGame}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all duration-300 font-bold px-3 sm:px-4 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg text-xs sm:text-sm lg:text-sm flex items-center gap-1 sm:gap-1.5 lg:gap-1.5 shadow-sm hover:shadow-md active:scale-95 min-w-[90px] h-[44px] sm:h-auto justify-center"
                >
                  <span className="text-base sm:text-base lg:text-base">🎮</span>
                  <span className="inline">开始游戏</span>
                </button>
                

              </div>
            </div>
          </div>
        </div>

        {/* 步骤引导 */}
        <div className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-orange-500/10 p-4 sm:p-5 lg:p-6 border border-white/50 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>🚀</span> 制作进度
              </h3>
              <div className="text-sm text-slate-600">
                步骤 {currentStep} / {steps.length}
              </div>
            </div>
            <div className="flex items-center space-x-4 overflow-x-auto pb-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all duration-300 ${
                    index + 1 < currentStep ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' :
                    index + 1 === currentStep ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white ring-4 ring-orange-200' :
                    'bg-slate-200 text-slate-600'
                  }`}>
                    {index + 1 < currentStep ? '✓' : index + 1}
                  </div>
                  <div className="ml-3 min-w-[120px]">
                    <div className={`font-semibold text-sm ${
                      index + 1 <= currentStep ? 'text-slate-800' : 'text-slate-500'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {step.description}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-4 ${
                      index + 1 < currentStep ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-slate-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-orange-500/10 p-4 sm:p-5 lg:p-6 border border-white/50 sticky top-24">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2">
                  <span>📚</span> 故事信息
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 sm:mb-2">游戏标题</label>
                    <input
                      type="text"
                      value={gameData.game_title}
                      onChange={(e) => {
                        const newData = { ...gameData, game_title: e.target.value }
                        setGameData(newData)
                        saveToHistory(newData)
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 sm:mb-2">游戏描述</label>
                    <textarea
                      value={gameData.description}
                      onChange={(e) => {
                        const newData = { ...gameData, description: e.target.value }
                        setGameData(newData)
                        saveToHistory(newData)
                      }}
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base resize-none"
                    />
                  </div>
                  
                  <div className="mt-4 sm:mt-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span>📊</span> 游戏状态配置
                      </h3>
                      <button
                        onClick={() => {
                          const newStates = [...(gameData.game_states || [])]
                          newStates.push({
                            name: `状态_${newStates.length + 1}`,
                            initial_value: 0,
                            is_percentage: false
                          })
                          const newData = { ...gameData, game_states: newStates }
                          setGameData(newData)
                          saveToHistory(newData)
                        }}
                        className="px-3 py-1.5 text-xs sm:text-sm font-medium bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-md active:scale-95"
                      >
                        + 添加状态
                      </button>
                    </div>
                    
                    {(gameData.game_states || []).map((state, index) => (
                      <div key={index} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2 sm:p-3">
                        <input
                          type="text"
                          value={state.name}
                          onChange={(e) => {
                            const newStates = [...(gameData.game_states || [])]
                            newStates[index] = { ...state, name: e.target.value }
                            const newData = { ...gameData, game_states: newStates }
                            setGameData(newData)
                            saveToHistory(newData)
                          }}
                          className="flex-1 px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                          placeholder="状态名称"
                        />
                        <input
                          type="number"
                          value={state.initial_value}
                          onChange={(e) => {
                            const newStates = [...(gameData.game_states || [])]
                            newStates[index] = { ...state, initial_value: parseFloat(e.target.value) || 0 }
                            const newData = { ...gameData, game_states: newStates }
                            setGameData(newData)
                            saveToHistory(newData)
                          }}
                          className="w-24 px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                          placeholder="初始值"
                        />
                        <input
                          type="number"
                          value={state.min ?? ''}
                          onChange={(e) => {
                            const newStates = [...(gameData.game_states || [])]
                            newStates[index] = { ...state, min: e.target.value ? parseFloat(e.target.value) : undefined }
                            const newData = { ...gameData, game_states: newStates }
                            setGameData(newData)
                            saveToHistory(newData)
                          }}
                          className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                          placeholder="最小值"
                        />
                        <input
                          type="number"
                          value={state.max ?? ''}
                          onChange={(e) => {
                            const newStates = [...(gameData.game_states || [])]
                            newStates[index] = { ...state, max: e.target.value ? parseFloat(e.target.value) : undefined }
                            const newData = { ...gameData, game_states: newStates }
                            setGameData(newData)
                            saveToHistory(newData)
                          }}
                          className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                          placeholder="最大值"
                        />
                        <button
                          onClick={() => {
                            const newStates = [...(gameData.game_states || [])]
                            newStates[index] = { ...state, is_percentage: !state.is_percentage }
                            const newData = { ...gameData, game_states: newStates }
                            setGameData(newData)
                            saveToHistory(newData)
                          }}
                          className={`px-2 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            state.is_percentage
                              ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                              : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          %
                        </button>
                        <button
                          onClick={() => {
                            const newStates = [...(gameData.game_states || [])]
                            newStates.splice(index, 1)
                            const newData = { ...gameData, game_states: newStates }
                            setGameData(newData)
                            saveToHistory(newData)
                          }}
                          className="px-2 py-1.5 rounded-lg text-sm font-medium bg-red-100 border-red-300 text-red-600 hover:bg-red-200 transition-all duration-200"
                        >
                          🗑
                        </button>
                      </div>
                    ))}
                    
                    {(gameData.game_states || []).length === 0 && (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        暂无游戏状态，点击上方"添加状态"按钮添加
                      </div>
                    )}
                  </div>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mt-6 mb-3 sm:mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>🌳</span> 故事分支
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        viewMode === 'list'
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      📋 列表
                    </button>
                    <button
                      onClick={() => setViewMode('graph')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        viewMode === 'graph'
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      🗺️ 导图
                    </button>
                  </div>
                </h2>
                <div className="space-y-2 sm:space-y-3 max-h-[400px] overflow-y-auto">
                  {gameData.branches.map((branch, index) => (
                    <div
                      key={branch.branch_id}
                      onClick={() => setSelectedBranchId(branch.branch_id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedBranchId === branch.branch_id
                          ? 'bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-500'
                          : 'bg-slate-50 border-2 border-transparent hover:border-slate-300'
                      }`}
                    >
                      <div className="font-semibold text-sm sm:text-base text-slate-800 truncate">
                        {index + 1}. {branch.chapter}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 truncate mt-1">
                        {branch.scene_detail.substring(0, 50)}...
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addBranch}
                    className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-bold hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 text-sm sm:text-base"
                  >
                    ➕ 添加新分支
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              {viewMode === 'graph' ? (
                <div 
                  ref={graphRef}
                  className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-orange-500/10 p-4 sm:p-5 lg:p-6 border border-white/50 overflow-hidden"
                  onWheel={handleWheel}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <div className="flex items-center justify-between mb-4 sm:mb-5">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                      <span>🗺️</span> 知识导图
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setScale(prev => Math.max(0.3, prev - 0.1))}
                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all duration-200 text-sm font-medium"
                      >
                        ➖
                      </button>
                      <span className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-sm font-medium">
                        {Math.round(scale * 100)}%
                      </span>
                      <button
                        onClick={() => setScale(prev => Math.min(3, prev + 0.1))}
                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all duration-200 text-sm font-medium"
                      >
                        ➕
                      </button>
                      <button
                        onClick={() => { setScale(1); setPan({ x: 0, y: 0 }) }}
                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all duration-200 text-sm font-medium"
                      >
                        🔄
                      </button>
                    </div>
                  </div>
                  
                  <div 
                    className="relative w-full h-[600px] overflow-hidden bg-gradient-to-br from-slate-50 to-orange-50/30 rounded-xl border border-slate-200 cursor-grab active:cursor-grabbing"
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                  >
                    <svg
                      width="100%"
                      height="100%"
                      style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: '0 0' }}
                    >
                      {/* Arrowhead marker definition */}
                      <defs>
                        <marker
                          id="arrowhead"
                          markerWidth="10"
                          markerHeight="7"
                          refX="9"
                          refY="3.5"
                          orient="auto"
                        >
                          <polygon points="0 0, 10 3.5, 0 7" fill="#f97316" />
                        </marker>
                      </defs>
                      
                      {/* Draw connections between nodes */}
                      {gameData.branches.map(branch => {
                        const nodePos = getNodePosition(branch.branch_id)
                        if (!nodePos) return null
                        
                        return (
                          <g key={branch.branch_id}>
                            {branch.choices.map(choice => {
                              if (!choice.next_branch) return null
                              const targetPos = getNodePosition(choice.next_branch)
                              if (!targetPos) return null
                              
                              return (
                                <line
                                  key={`${branch.branch_id}-${choice.id}`}
                                  x1={nodePos.x}
                                  y1={nodePos.y}
                                  x2={targetPos.x}
                                  y2={targetPos.y}
                                  stroke="#f97316"
                                  strokeWidth="2"
                                  markerEnd="url(#arrowhead)"
                                />
                              )
                            })}
                          </g>
                        )
                      })}
                      
                      {/* Draw nodes */}
                      {visibleNodes.map(pos => {
                        const branch = gameData.branches.find(b => b.branch_id === pos.id)
                        if (!branch) return null
                        
                        return (
                          <g
                            key={pos.id}
                            onClick={() => setSelectedBranchId(pos.id)}
                            className="cursor-pointer transition-all duration-200 hover:opacity-80"
                          >
                            <rect
                              x={pos.x - 80}
                              y={pos.y - 30}
                              width="160"
                              height="60"
                              rx="8"
                              fill={selectedBranchId === pos.id ? '#fef3c7' : '#ffffff'}
                              stroke={selectedBranchId === pos.id ? '#f97316' : '#e2e8f0'}
                              strokeWidth={selectedBranchId === pos.id ? '3' : '2'}
                            />
                            <text
                              x={pos.x}
                              y={pos.y - 5}
                              textAnchor="middle"
                              fontSize="12"
                              fontWeight="bold"
                              fill="#1e293b"
                            >
                              {branch.chapter.substring(0, 15)}{branch.chapter.length > 15 ? '...' : ''}
                            </text>
                            <text
                              x={pos.x}
                              y={pos.y + 15}
                              textAnchor="middle"
                              fontSize="10"
                              fill="#64748b"
                            >
                              {branch.choices.length} 个选项
                            </text>
                          </g>
                        )
                      })}
                    </svg>
                  </div>
                </div>
              ) : selectedBranch ? (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-orange-500/10 p-4 sm:p-5 lg:p-6 border border-white/50">
                  <div className="flex items-center justify-between mb-4 sm:mb-5">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                      <span>✏️</span> 编辑分支
                    </h2>
                    <button
                      onClick={() => deleteBranch(selectedBranch.branch_id)}
                      className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-all duration-300 font-bold text-sm sm:text-base flex items-center gap-1 shadow-md hover:shadow-lg active:scale-95"
                    >
                      <IconDelete className="w-4 h-4" />
                      删除分支
                    </button>
                  </div>

                  <div className="space-y-4 sm:space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1 sm:mb-2">分支ID</label>
                      <input
                        type="text"
                        value={selectedBranch.branch_id}
                        onChange={(e) => updateBranch(selectedBranch.branch_id, 'branch_id', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base bg-slate-50"
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1 sm:mb-2">章节名称</label>
                      <input
                        type="text"
                        value={selectedBranch.chapter}
                        onChange={(e) => updateBranch(selectedBranch.branch_id, 'chapter', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1 sm:mb-2">场景描述</label>
                      <textarea
                        value={selectedBranch.scene_detail}
                        onChange={(e) => updateBranch(selectedBranch.branch_id, 'scene_detail', e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base resize-none"
                      />
                    </div>

                    {/* 背景图片上传 */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1 sm:mb-2">背景图片</label>
                      <div className="space-y-3">
                        {selectedBranch.background_image && (
                          <div className="relative">
                            <img
                              src={selectedBranch.background_image}
                              alt="背景图片"
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                            <button
                              onClick={() => updateBranch(selectedBranch.branch_id, 'background_image', '')}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                // 文件大小验证（5MB限制）
                                const maxSize = 5 * 1024 * 1024 // 5MB
                                if (file.size > maxSize) {
                                  toast.error(`图片大小不能超过5MB，当前大小: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
                                  return
                                }
                                
                                // 文件格式验证
                                const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
                                if (!allowedTypes.includes(file.type)) {
                                  toast.error('请上传 JPG、PNG 或 WebP 格式的图片')
                                  return
                                }
                                
                                try {
                                  const assetId = await gameStore.storeAsset(file, file.name, 'image')
                                  const imageUrl = URL.createObjectURL(file)
                                  updateBranch(selectedBranch.branch_id, 'background_image', imageUrl)
                                  updateBranch(selectedBranch.branch_id, 'background_asset_id', assetId)
                                  toast.success('背景图片上传成功')
                                } catch (error) {
                                  console.error('上传背景图片失败:', error)
                                  toast.error('上传背景图片失败')
                                }
                              }
                            }}
                            className="flex-1 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 实时预览 */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1 sm:mb-2">实时预览</label>
                      <div 
                        className="relative w-full h-48 rounded-lg border-2 border-slate-300 overflow-hidden bg-slate-100"
                        style={{
                          backgroundImage: selectedBranch.background_image ? `url(${selectedBranch.background_image})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat'
                        }}
                      >
                        <div className="absolute inset-0 bg-black/50 p-4">
                          <div className="text-white">
                            <h4 className="font-bold text-lg mb-2">{selectedBranch.chapter}</h4>
                            <p className="text-sm opacity-90">{selectedBranch.scene_detail}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                          <span>🎯</span> 选择选项
                        </h3>
                        <button
                          onClick={() => addChoice(selectedBranch.branch_id)}
                          className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-2 rounded-lg font-bold hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 text-sm sm:text-base flex items-center gap-1"
                        >
                          ➕ 添加选项
                        </button>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        {selectedBranch.choices.map((choice, index) => (
                          <div
                            key={choice.id}
                            className="bg-gradient-to-br from-orange-50/50 to-red-50/50 rounded-xl p-4 border border-orange-200"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-slate-700">选项 {index + 1}</span>
                              <button
                                onClick={() => deleteChoice(selectedBranch.branch_id, choice.id)}
                                className="text-red-500 hover:text-red-700 transition-colors text-sm font-medium"
                              >
                                删除
                              </button>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">选项文本</label>
                                <input
                                  type="text"
                                  value={choice.choice}
                                  onChange={(e) => updateChoice(selectedBranch.branch_id, choice.id, 'choice', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">跳转到分支</label>
                                <select
                                  value={choice.next_branch}
                                  onChange={(e) => updateChoice(selectedBranch.branch_id, choice.id, 'next_branch', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                >
                                  <option key="default" value="">选择目标分支</option>
                                  {gameData.branches.map(b => (
                                    <option key={b.branch_id} value={b.branch_id}>
                                      {b.branch_id} - {b.chapter}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">效果（可选）</label>
                                <input
                                  type="text"
                                  value={choice.effect || ''}
                                  onChange={(e) => updateChoice(selectedBranch.branch_id, choice.id, 'effect', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                  placeholder="例如：获得物品"
                                />
                              </div>

                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={choice.end_game || false}
                                    onChange={(e) => updateChoice(selectedBranch.branch_id, choice.id, 'end_game', e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                                  />
                                  <span className="text-sm text-slate-700">结束游戏</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-orange-500/10 p-8 sm:p-12 lg:p-16 border border-white/50 text-center">
                  <div className="text-6xl sm:text-7xl lg:text-8xl mb-4 sm:mb-6">📝</div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3 sm:mb-4">选择一个分支进行编辑</h3>
                  <p className="text-base sm:text-lg text-slate-600 mb-6 sm:mb-8">从左侧列表中选择一个分支，或者创建一个新的分支开始编辑你的故事。</p>
                  <button
                    onClick={addBranch}
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 text-base sm:text-lg"
                  >
                    ➕ 创建第一个分支
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
