'use client'

import React, { useEffect, useRef, useState } from 'react'

// 打字机效果组件
const TypewriterText = ({ text, delay = 30, onComplete }: { text: string; delay?: number; onComplete?: () => void }) => {
  const [displayText, setDisplayText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    let index = 0
    let timer: NodeJS.Timeout
    
    const typeWriter = () => {
      if (index < text.length) {
        setDisplayText((prev) => prev + text.charAt(index))
        index++
        timer = setTimeout(typeWriter, delay)
      } else {
        setIsComplete(true)
        if (onComplete) {
          onComplete()
        }
      }
    }
    
    typeWriter()
    
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [text, delay, onComplete])

  if (isComplete) {
    return <>{text}</>
  }

  return <>{displayText}</>
}

// 渲染 Markdown
const renderMarkdown = (text: string) => {
  if (typeof text !== 'string') return text
  
  let html = text
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>')
  html = html.replace(/`(.*?)`/g, '<code>$1</code>')
  html = html.replace(/\n/g, '<br/>')
  return html
}

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true)
  const [outputHistory, setOutputHistory] = useState<Array<{ 
    type: 'user' | 'system' | 'room-name' | 'room-desc' | 'choices-data' | 'user-choice', 
    content: string; 
    className?: string; 
    fullContent?: string; 
  }>>([])
  const [choices, setChoices] = useState<any[]>([])
  const [inventory, setInventory] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentScene, setCurrentScene] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)

  // 修复 Hydration 错误：确保组件只在客户端渲染
  useEffect(() => {
    setIsClient(true)
  }, [])

  const storyData = {
    start: 'foyer',
    scenes: {
      foyer: {
        id: 'foyer',
        name: 'The Foyer',
        desc: '**欢迎使用 TEXT ENGINE 演示光盘！**\n\n这张光盘是一个文本冒险游戏，旨在介绍 text engine 中可用的功能。\n\n输入 **LOOK** 查看四周。',
        img: '',
        exits: [
          { dir: 'north', id: 'reception' }
        ],
        items: [
          { name: 'tall window', desc: '你只能看到蓬松的白云在蓝天上。' }
        ]
      },
      reception: {
        id: 'reception',
        name: 'Reception Desk',
        desc: '**BENJI** 在这里。我确信他很高兴告诉你关于 text engine 中可用的功能。\n\n*你可以使用 **TALK** 命令与角色交谈。\n\n向 **EAST** 是一扇关闭的 **DOOR**。\n\n向 **SOUTH** 是你开始冒险的大厅。\n\n在 **DESK** 旁边是通往 **UP** 的 **STAIRS**。',
        exits: [
          { dir: 'east', id: 'lab' },
          { dir: 'south', id: 'foyer' }
        ],
        items: [
          { name: 'desk' },
          { name: 'door', desc: '门上有 4 英寸的金属字母钉着。它们拼写为："RESEARCH LAB".' }
        ]
      },
      lab: {
        id: 'lab',
        name: 'Research Lab',
        desc: '有一个 **蓝色机器人** 静静悬浮在白色虚空的中央。它们似乎在等待指示。（输入 **TALK** 与机器人交谈。）',
        exits: [
          { dir: 'west', id: 'reception' }
        ],
        items: []
      }
    }
  }

  // 缓慢优雅下滑的效果
  const scrollToBottom = () => {
    setTimeout(() => {
      const scrollHeight = document.body.scrollHeight || document.documentElement.scrollHeight
      window.scrollTo({
        top: scrollHeight,
        behavior: 'smooth'
      })
    }, 100)
  }

  const executeCommand = (cmd: string) => {
    if (typeof cmd !== 'string') return

    // 立即添加用户命令到输出历史
    setOutputHistory(prev => [...prev, { type: 'user', content: `> ${cmd}` }])

    switch (cmd.toLowerCase()) {
      case 'look':
        if (currentScene) {
          // 添加场景名称
          setOutputHistory(prev => [...prev, { type: 'room-name', content: currentScene.name, className: 'room-name', fullContent: currentScene.name }])
          // 添加场景描述
          setTimeout(() => {
            setOutputHistory(prev => [...prev, { type: 'room-desc', content: currentScene.desc, fullContent: currentScene.desc }])
          }, 100)
          scrollToBottom()
        }
        break

      case 'items':
        if (currentScene && currentScene.items) {
          const items = currentScene.items
            .map((item: any) => item.desc ? `${item.name}: ${item.desc}` : item.name)
            .join('\n')
          setOutputHistory(prev => [...prev, { type: 'system', content: `你看到：\n${items}`, fullContent: `你看到：\n${items}` }])
          scrollToBottom()
        }
        break

      case 'inv':
      case 'inventory':
        if (inventory.length === 0) {
          setOutputHistory(prev => [...prev, { type: 'system', content: '你的背包是空的。', fullContent: '你的背包是空的。' }])
        } else {
          const items = inventory.map(i => `  • ${i}`).join('\n')
          setOutputHistory(prev => [...prev, { type: 'system', content: `你的背包：\n${items}`, fullContent: `你的背包：\n${items}` }])
        }
        scrollToBottom()
        break

      case 'help':
        setOutputHistory(prev => [...prev, { type: 'system', content: '可用命令：\n  LOOK - 观察四周\n  ITEMS - 列出房间内的物品\n  INV - 检查你的背包\n  HELP - 显示此帮助消息', fullContent: '可用命令：\n  LOOK - 观察四周\n  ITEMS - 列出房间内的物品\n  INV - 检查你的背包\n  HELP - 显示此帮助消息' }])
        scrollToBottom()
        break

      case 'save':
        setOutputHistory(prev => [...prev, { type: 'system', content: '游戏已保存！', fullContent: '游戏已保存！' }])
        scrollToBottom()
        break

      case 'load':
        setOutputHistory(prev => [...prev, { type: 'system', content: '游戏已加载！', fullContent: '游戏已加载！' }])
        scrollToBottom()
        break

      case 'clear':
        setOutputHistory(prev => [])
        break

      default:
        const dirMap: Record<string, string> = {
          'n': 'north', 's': 'south', 'e': 'east', 'w': 'west',
          'north': 'north', 'south': 'south', 'east': 'east', 'west': 'west'
        }

        let matchedDir: string | null = null
        const commandLower = cmd.toLowerCase()

        for (const [key, dir] of Object.entries(dirMap)) {
          if (commandLower === key || commandLower.startsWith(key + ' ')) {
            matchedDir = dir
            break
          }
        }

        if (matchedDir) {
          if (currentScene && currentScene.exits) {
            const exit = currentScene.exits.find((e: any) => e.dir === matchedDir)
            if (exit) {
              const choiceText = `> ${matchedDir.toUpperCase()} -> ${exit.id}`
              setOutputHistory(prev => [...prev, { type: 'user-choice', content: choiceText }])
              moveToScene(exit.id, `${matchedDir.toUpperCase()} -> ${exit.id}`)
            } else {
              setOutputHistory(prev => [...prev, { type: 'system', content: `向 ${matchedDir} 没有出口。`, fullContent: `向 ${matchedDir} 没有出口。` }])
              scrollToBottom()
            }
          }
        } else {
          setOutputHistory(prev => [...prev, { type: 'system', content: `未知命令：${cmd}。输入 HELP 查看可用命令。`, fullContent: `未知命令：${cmd}。输入 HELP 查看可用命令。` }])
          scrollToBottom()
        }
    }
  }

  const moveToScene = (sceneId: string, command: string) => {
    if (typeof sceneId !== 'string') return

    const newScene = storyData.scenes[sceneId]
    if (!newScene) {
      setOutputHistory(prev => [...prev, { type: 'system', content: '那个出口似乎通向任何地方。', fullContent: '那个出口似乎通向任何地方。' }])
      scrollToBottom()
      return
    }

    setCurrentScene(newScene)
    setChoices(newScene.exits || [])

    // 添加场景名称和描述（一次性添加）
    setOutputHistory(prev => [...prev, 
      { type: 'room-name', content: newScene.name, className: 'room-name', fullContent: newScene.name },
      { type: 'room-desc', content: newScene.desc, fullContent: newScene.desc }
    ])

    setInventory(prev => [...prev, ...(newScene.items || []).map((i: any) => i.name)])

    // 缓慢优雅下滑
    setTimeout(() => {
      const scrollHeight = document.body.scrollHeight || document.documentElement.scrollHeight
      window.scrollTo({
        top: scrollHeight,
        behavior: 'smooth'
      })
    }, 500)
  }

  // 导出 JSON 功能（仅导出 JSON 数据）
  const exportJson = () => {
    const data = {
      scene: currentScene?.id,
      inventory: inventory,
      timestamp: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'game-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  // 导出进度功能
  const exportProgress = () => {
    const data = {
      scene: currentScene?.id,
      inventory: inventory,
      history: outputHistory,
      choices: choices,
      timestamp: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'game-progress.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  // 导出 txt 功能
  const exportTxt = () => {
    const text = outputHistory.map(item => item.fullContent || item.content).join('\n\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'game-log.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  // 导入 JSON 功能
  const importJson = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        
        // 清空输出历史
        setOutputHistory([])
        
        // 恢复游戏状态
        if (data.scene) {
          const newScene = storyData.scenes[data.scene]
          if (newScene) {
            setCurrentScene(newScene)
            setChoices(newScene.exits || [])
          }
        }
        if (data.inventory) {
          setInventory(data.inventory)
        }
        
        // 添加场景名称和描述（一次性添加）
        const newScene = storyData.scenes[data.scene]
        if (newScene) {
          setTimeout(() => {
            setOutputHistory(prev => [...prev, 
              { type: 'room-name', content: newScene.name, className: 'room-name', fullContent: newScene.name },
              { type: 'room-desc', content: newScene.desc, fullContent: newScene.desc }
            ])
          }, 100)
        }
        
        // 缓慢优雅下滑
        setTimeout(() => {
          const scrollHeight = document.body.scrollHeight || document.documentElement.scrollHeight
          window.scrollTo({
            top: scrollHeight,
            behavior: 'smooth'
          })
        }, 1000)
        
        // 显示导入成功消息
        setTimeout(() => {
          setOutputHistory(prev => [...prev, { type: 'system', content: '游戏导入成功！', fullContent: '游戏导入成功！' }])
        }, 500)
      } catch (error) {
        setOutputHistory(prev => [...prev, { type: 'system', content: '游戏导入失败：无效的 JSON', fullContent: '游戏导入失败：无效的 JSON' }])
        scrollToBottom()
      }
    }
    reader.readAsText(file)
  }

  useEffect(() => {
    if (outputHistory.length > 0 && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [outputHistory])

  // 修复 Hydration 错误：只在客户端渲染内容
  if (!isClient) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        加载中...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased" suppressHydrationWarning>
      {isProcessing && (
        <div className="h-1 bg-indigo-600 w-full fixed top-0 left-0 animate-pulse z-20" />
      )}

      {showWelcome && (
        <div className="absolute inset-0 bg-white flex flex-col items-center justify-start text-center p-5 z-50 leading-relaxed text-lg overflow-y-auto pt-16" suppressHydrationWarning>
          {/* 欢迎界面标题 */}
          <h1 className="text-4xl mb-6 font-bold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-wide uppercase" suppressHydrationWarning>
            文本引擎
          </h1>
          
          {/* 欢迎界面描述 */}
          <p className="max-w-[600px] text-gray-900 mx-4 my-3 text-xl" suppressHydrationWarning>
            使用这个引擎，<br />你可以制作自己的文字游戏。
          </p>
          <p className="mt-8 text-base text-gray-500" suppressHydrationWarning>
            输入 <strong className="text-indigo-600">LOOK</strong> 查看四周。
          </p>

          {/* 主要按钮 - 渐变背景 */}
          <div className="w-full max-w-[480px] mx-auto my-8" suppressHydrationWarning>
            <button
              className="w-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold px-6 py-3 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 text-lg py-7 px-16 font-bold tracking-wider uppercase"
              onClick={() => {
                setShowWelcome(false)
                const initialScene = storyData.scenes[storyData.start]
                setCurrentScene(initialScene)
                setChoices(initialScene.exits || [])
                // 添加场景名称和描述（一次性添加）
                setOutputHistory([
                  { type: 'room-name', content: initialScene.name, className: 'room-name', fullContent: initialScene.name },
                  { type: 'room-desc', content: initialScene.desc, fullContent: initialScene.desc }
                ])
              }}
            >
              🚀 开始游戏
            </button>
          </div>

          {/* 辅助按钮 - 浅绿色 */}
          <div className="flex gap-3 justify-center flex-wrap my-5" suppressHydrationWarning>
            <button
              onClick={() => {
                const data = JSON.stringify(storyData, null, 2)
                const blob = new Blob([data], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'example-story.json'
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 transition-all font-medium px-6 py-3 rounded-lg"
            >
              📄 示例JSON
            </button>
            <button
              onClick={() => window.open('JSON-GUIDE.html', '_blank')}
              className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 transition-all font-medium px-6 py-3 rounded-lg"
            >
              🚀 星际探索
            </button>
            <button
              onClick={() => window.open('USER-GUIDE.html', '_blank')}
              className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 transition-all font-medium px-6 py-3 rounded-lg"
            >
              📚 用户指南
            </button>
          </div>

          {/* 快速开始指南 */}
          <div className="my-9 p-5 bg-indigo-50/10 rounded-xl border-l-4 border-indigo-600 backdrop-blur-sm max-w-[500px] mx-auto text-left" suppressHydrationWarning>
            <h3 className="mb-4 text-indigo-600 text-xl font-semibold">🚀 快速开始指南</h3>
            <div className="space-y-2 text-base leading-relaxed">
              <p><strong>1. 开始游戏：</strong>点击主按钮，立即开始冒险</p>
              <p><strong>2. 探索世界：</strong>使用 <code className="bg-gray-100 px-2 py-1 rounded text-sm">LOOK</code> 查看，<code className="bg-gray-100 px-2 py-1 rounded text-sm">GO 北</code> 移动</p>
              <p><strong>3. 互动操作：</strong><code className="bg-gray-100 px-2 py-1 rounded text-sm">TAKE 饥匙</code> 拾取，<code className="bg-gray-100 px-2 py-1 rounded text-sm">USE 物品</code> 使用</p>
              <p><strong>4. 对话系统：</strong><code className="bg-gray-100 px-2 py-1 rounded text-sm">TALK TO 角色名</code> 与NPC交流</p>
              <p><strong>5. 自定义故事：</strong>下载示例JSON → 修改 → 导入 → 开始冒险！</p>
            </div>
          </div>

          {/* 相关资源 - 浅绿色按钮 */}
          <div className="my-5 p-4 bg-emerald-50/10 rounded-xl border-l-4 border-emerald-600 text-base leading-relaxed" suppressHydrationWarning>
            <strong className="block mb-3 text-emerald-600">📚 相关资源</strong>
            <div className="flex gap-3 justify-center flex-wrap mt-4">
              <button
                onClick={() => window.open('JSON-GUIDE.html', '_blank')}
                className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 transition-all font-medium px-6 py-3 rounded-lg"
              >
                JSON格式说明
              </button>
              <button
                onClick={() => window.open('USER-GUIDE.html', '_blank')}
                className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 transition-all font-medium px-6 py-3 rounded-lg"
              >
                完整使用说明
              </button>
              <button
                onClick={() => window.open('json-validator.html', '_blank')}
                className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 transition-all font-medium px-6 py-3 rounded-lg"
              >
                JSON验证器
              </button>
              <button
                onClick={() => window.open('JSON-STORY-GUIDE.html', '_blank')}
                className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 transition-all font-medium px-6 py-3 rounded-lg"
              >
                故事创作指南
              </button>
            </div>
          </div>
        </div>
      )}

      {!showWelcome && (
        <div className="flex flex-col min-h-screen max-w-[1200px] mx-auto w-full bg-white relative overflow-hidden" suppressHydrationWarning>
          {/* 头部 - 圆角深蓝色背景，文字和按钮居中 */}
          <div className="p-4 text-center bg-indigo-600 mx-4 my-2 sticky top-0 z-10" suppressHydrationWarning>
            <h1 className="text-xl font-semibold text-white tracking-tight mb-2">文本引擎 - 融合版</h1>
            
            {/* 顶部按钮行：导入JSON、导出JSON、反馈、返回主菜单 */}
            <div className="flex flex-wrap gap-3 justify-center mt-3 items-center" suppressHydrationWarning>
              {/* 导入JSON - 文件选择器 */}
              <div className="relative">
                <label className="bg-indigo-500/30 text-white border border-indigo-400/50 hover:bg-indigo-500/50 hover:border-indigo-400 transition-all font-medium px-4 py-2 rounded-full text-sm block cursor-pointer">
                  📤 导入JSON
                </label>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    importJson(file)
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              
              {/* 导出JSON - 导出完整的JSON文件 */}
              <button
                onClick={() => {
                  const data = {
                    scene: currentScene?.id,
                    inventory: inventory,
                    timestamp: new Date().toISOString()
                  }
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'game-data.json'
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="bg-indigo-500/30 text-white border border-indigo-400/50 hover:bg-indigo-500/50 hover:border-indigo-400 transition-all font-medium px-4 py-2 rounded-full text-sm"
              >
                📥 导出JSON
              </button>
              
              <a
                href="https://simplefeedback.app/feedback/nDf7Lhk7Ohnw"
                target="_blank"
                className="bg-indigo-500/30 text-white border border-indigo-400/50 hover:bg-indigo-500/50 hover:border-indigo-400 transition-all font-medium px-4 py-2 rounded-full text-sm"
                suppressHydrationWarning
              >
                💬 反馈
              </a>
              
              <button
                onClick={() => {
                  setShowWelcome(true)
                  setOutputHistory([])
                  setCurrentScene(null)
                  setChoices([])
                }}
                className="bg-indigo-500/30 text-white border border-indigo-400/50 hover:bg-indigo-500/50 hover:border-indigo-400 transition-all font-medium px-4 py-2 rounded-full text-sm"
              >
                🏠 返回主菜单
              </button>
            </div>
          </div>

          {/* 输出区域 */}
          <div className="flex-grow overflow-y-auto p-8 lg:p-12 space-y-4 font-mono text-gray-900" style={{ lineHeight: '1.8' }} suppressHydrationWarning>
            <div ref={outputRef} className="min-h-[200px]" suppressHydrationWarning>
              {outputHistory.map((item, index) => {
                switch (item.type) {
                  case 'room-name':
                    return (
                      <div key={index} className="text-xl font-bold text-indigo-600 mt-6 mb-2" suppressHydrationWarning>
                        <TypewriterText text={item.fullContent || item.content} delay={50} onComplete={scrollToBottom} />
                      </div>
                    )

                  case 'room-desc':
                    return (
                      <div key={index} className="my-2.5 p-2.5 leading-relaxed text-gray-500 whitespace-pre-line" suppressHydrationWarning>
                        <TypewriterText text={item.fullContent || item.content} delay={20} onComplete={scrollToBottom} />
                      </div>
                    )

                  case 'user':
                    return (
                      <div key={index} className="my-1 p-3 rounded-lg bg-indigo-50/20 text-indigo-600 text-base" suppressHydrationWarning>
                        {item.content}
                      </div>
                    )

                  case 'system':
                    return (
                      <div key={index} className="my-1 p-3 rounded-lg bg-transparent text-base" suppressHydrationWarning>
                        <TypewriterText text={item.fullContent || item.content} delay={15} onComplete={scrollToBottom} />
                      </div>
                    )

                  case 'user-choice':
                    return (
                      <div key={index} className="my-1 p-3 rounded-lg bg-emerald-50/20 text-emerald-700 font-medium border-l-4 border-emerald-600 text-base" suppressHydrationWarning>
                        {item.content}
                      </div>
                    )

                  case 'choices-data':
                    return null

                  default:
                    return (
                      <div key={index} className="my-1 p-3 rounded-lg bg-transparent text-base" suppressHydrationWarning>
                        {item.content}
                      </div>
                    )
                }
              })}
            </div>
          </div>

          {/* 动态选择按钮区域 */}
          <div className="p-5 bg-gray-50/50 border-t border-gray-200" suppressHydrationWarning>
            {/* 移动端：每行 4 个，允许多行；电脑端：每行 8 个 */}
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2" suppressHydrationWarning>
              {choices.length > 0 ? (
                choices.map((choice: any, idx) => {
                  const directionName = choice.dir ? choice.dir.toUpperCase() : choice.id
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setIsProcessing(true)
                          const choiceText = `> ${directionName} -> ${choice.id}`
                          setOutputHistory(prev => [...prev, { type: 'user-choice', content: choiceText }])
                          
                          setTimeout(() => {
                            setIsProcessing(false)
                            moveToScene(choice.id, `${directionName} -> ${choice.id}`)
                          }, 500)
                        }}
                        disabled={isProcessing}
                        className="bg-indigo-600 text-white border-2 border-indigo-500/80 rounded-lg text-base font-medium cursor-pointer transition-all w-full text-center hover:shadow-md hover:-translate-y-0.5 disabled:cursor-not-allowed"
                      >
                        {directionName}
                        {choice.id && <span className="text-sm opacity-90 block">{choice.id}</span>}
                      </button>
                    )
                })
              ) : null}
            </div>
          </div>

          {/* 快捷操作按钮 */}
          <div className="p-3 bg-white border-t border-b border-gray-200" suppressHydrationWarning>
            {/* 移动端：每行 4 个，允许多行；电脑端：每行 8 个 */}
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2" suppressHydrationWarning>
              <button onClick={() => executeCommand('look')} className="bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-indigo-600 transition-all text-sm px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2">
                👁️ 观察
              </button>
              <button onClick={() => executeCommand('items')} className="bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-indigo-600 transition-all text-sm px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2">
                📦 物品
              </button>
              <button onClick={() => executeCommand('inv')} className="bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-indigo-600 transition-all text-sm px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2">
                🎒 背包
              </button>
              <button onClick={() => executeCommand('help')} className="bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-indigo-600 transition-all text-sm px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2">
                ❓ 帮助
              </button>
              <button onClick={() => executeCommand('save')} className="bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-indigo-600 transition-all text-sm px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2">
                💾 保存
              </button>
              <button onClick={() => executeCommand('load')} className="bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-indigo-600 transition-all text-sm px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2">
                📂 读取
              </button>
              <button onClick={() => executeCommand('clear')} className="bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-indigo-600 transition-all text-sm px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2">
                🗑️ 清除
              </button>
              <button onClick={() => window.open('USER-GUIDE.html', '_blank')} className="bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-indigo-600 transition-all text-sm px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2">
                📚 指南
              </button>
            </div>
          </div>

          {/* 输入控制栏 */}
          <div className="sticky bottom-0 z-40" suppressHydrationWarning>
            {/* 输入框单独一行 */}
            <div className="p-4 sm:p-6 flex gap-4 bg-white border-t border-gray-200" suppressHydrationWarning>
              <input
                id="input"
                type="text"
                placeholder="输入命令..."
                autoComplete="off"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.currentTarget.value.trim()
                    if (input) {
                      executeCommand(input)
                      e.currentTarget.value = ''
                    }
                  }
                }}
                className="flex-grow p-3 rounded-lg border border-gray-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all font-mono text-base w-full"
                suppressHydrationWarning
              />
            </div>

            {/* 底部按钮行：发送、导出txt、导出进度 */}
            <div className="p-4 sm:p-6 flex gap-4 bg-white border-t border-gray-200" suppressHydrationWarning>
              {/* 3 个按钮，一样大小，一样规格，动态调整大小 */}
              <div className="flex flex-1 gap-3" suppressHydrationWarning>
                <button onClick={() => {
                  const input = document.getElementById('input') as HTMLInputElement
                  if (input.value.trim()) {
                    executeCommand(input.value.trim())
                    input.value = ''
                  }
                }} className="bg-indigo-600 text-white hover:bg-indigo-700 transition-all font-semibold px-6 py-3 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 text-base flex-1">
                  🚀 发送
                </button>
                <button onClick={exportTxt} className="bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-indigo-600 transition-all font-medium px-4 py-2 rounded-lg text-base flex-1">
                  📄 导出txt
                </button>
                <button onClick={exportProgress} className="bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-indigo-600 transition-all font-medium px-4 py-2 rounded-lg text-base flex-1">
                  📥 导出进度
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
