'use client'

import React, { useState, useEffect, useRef } from 'react'
import { IconSave, IconLoad, IconDelete, IconClose, IconHome, IconBox } from '../icons'

interface Choice {
  id: string
  choice: string
  next_branch: string
  effect?: string
  status_update?: string
  end_game?: boolean
}

interface Branch {
  branch_id: string
  chapter: string
  scene_detail: string
  choices: Choice[]
}

interface GameData {
  game_title: string
  description: string
  status?: string
  branches: Branch[]
}

export default function GameEditor() {
  const [gameData, setGameData] = useState<GameData>({
    game_title: '我的故事',
    description: '这是一个精彩的故事...',
    branches: []
  })
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [history, setHistory] = useState<GameData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const saveToHistory = (data: GameData) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.parse(JSON.stringify(data)))
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
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

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(gameData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${gameData.game_title}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJson = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.game_title && data.branches && Array.isArray(data.branches)) {
          setGameData(data)
          saveToHistory(data)
          alert('导入成功！')
        } else {
          alert('无效的游戏文件格式')
        }
      } catch (error) {
        alert('JSON解析失败：' + error)
      }
    }
    reader.readAsText(file)
  }

  const startGame = () => {
    sessionStorage.setItem('gameData', JSON.stringify(gameData))
    window.location.href = '/'
  }

  const selectedBranch = gameData.branches.find(b => b.branch_id === selectedBranchId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-red-50/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400/5 via-red-400/5 to-pink-400/5 backdrop-blur-sm"></div>
      
      <div className="relative z-10">
        <div className="bg-white/90 backdrop-blur-xl border-b border-white/50 sticky top-0 z-10 shadow-lg shadow-orange-500/5 pt-[env(safe-area-inset-top)]">
          <div className="px-3 sm:px-5 lg:px-7 py-3 sm:py-4 lg:py-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 lg:gap-4">
              <h1 className="text-base sm:text-xl lg:text-3xl font-extrabold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent tracking-tight flex items-center gap-1 sm:gap-1.5 lg:gap-2 whitespace-nowrap">
                <span className="text-base sm:text-xl lg:text-3xl">📝</span>
                <span>文本游戏制作</span>
              </h1>
              
              <div className="flex flex-nowrap gap-2 sm:gap-2 lg:gap-3 items-center justify-center w-full sm:w-auto">
                <button
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="bg-transparent text-slate-600 hover:text-slate-700 border-2 border-slate-600 hover:border-slate-700 transition-all duration-300 font-bold px-3 sm:px-4 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg text-xs sm:text-sm lg:text-sm flex items-center gap-1 sm:gap-1.5 lg:gap-1.5 shadow-sm hover:shadow-md active:scale-95 min-w-[90px] h-[44px] sm:h-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ↩️ 撤销
                </button>
                
                <button
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="bg-transparent text-slate-600 hover:text-slate-700 border-2 border-slate-600 hover:border-slate-700 transition-all duration-300 font-bold px-3 sm:px-4 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg text-xs sm:text-sm lg:text-sm flex items-center gap-1 sm:gap-1.5 lg:gap-1.5 shadow-sm hover:shadow-md active:scale-95 min-w-[90px] h-[44px] sm:h-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ↪️ 重做
                </button>
                
                <div className="relative">
                  <label className="bg-transparent text-orange-600 hover:text-orange-700 border-2 border-orange-600 hover:border-orange-700 transition-all duration-300 font-bold px-3 sm:px-4 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg text-xs sm:text-sm lg:text-sm flex items-center gap-1 sm:gap-1.5 lg:gap-1.5 cursor-pointer shadow-sm hover:shadow-md active:scale-95 min-w-[90px] h-[44px] sm:h-auto justify-center">
                    <span className="text-base sm:text-base lg:text-base">📤</span>
                    <span className="inline">导入</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      const file = event.target.files?.[0]
                      if (file) {
                        importJson(file)
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                
                <button
                  onClick={exportJson}
                  className="bg-transparent text-orange-600 hover:text-orange-700 border-2 border-orange-600 hover:border-orange-700 transition-all duration-300 font-bold px-3 sm:px-4 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg text-xs sm:text-sm lg:text-sm flex items-center gap-1 sm:gap-1.5 lg:gap-1.5 shadow-sm hover:shadow-md active:scale-95 min-w-[90px] h-[44px] sm:h-auto justify-center"
                >
                  <span className="text-base sm:text-base lg:text-base">📥</span>
                  <span className="inline">导出</span>
                </button>
                
                <button
                  onClick={startGame}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all duration-300 font-bold px-3 sm:px-4 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg text-xs sm:text-sm lg:text-sm flex items-center gap-1 sm:gap-1.5 lg:gap-1.5 shadow-sm hover:shadow-md active:scale-95 min-w-[90px] h-[44px] sm:h-auto justify-center"
                >
                  <span className="text-base sm:text-base lg:text-base">🎮</span>
                  <span className="inline">开始游戏</span>
                </button>
                
                <button
                  onClick={() => {
                    window.location.href = '/'
                  }}
                  className="bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300 font-bold px-3 sm:px-4 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg text-xs sm:text-sm lg:text-sm flex items-center gap-1 sm:gap-1.5 lg:gap-1.5 shadow-sm hover:shadow-md active:scale-95 min-w-[90px] h-[44px] sm:h-auto justify-center"
                >
                  <IconHome className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5" />
                  <span className="inline">返回</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto">
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
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mt-6 mb-3 sm:mb-4 flex items-center gap-2">
                  <span>🌳</span> 故事分支
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
              {selectedBranch ? (
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
                                  <option value="">选择目标分支</option>
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
