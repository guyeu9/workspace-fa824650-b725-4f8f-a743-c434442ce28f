'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as Icons from './icons'
import { exportJson as exportJsonFile, exportText as exportTextFile } from '../lib/file-export'
import { useAppNavigation } from '../lib/navigation'
import { useExportNotifications } from '../components/export-notifications'

const { IconTimeline, IconInventory, IconSettings, IconCompass, IconEye, IconSave, IconLoad, IconDelete, IconClose, IconSend, IconMove, IconInteract, IconUse, IconFeedback, IconHome, IconBox, IconHelp, IconScroll, IconFile } = Icons

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
  const [showEditor, setShowEditor] = useState(false)
  const [outputHistory, setOutputHistory] = useState<Array<{ 
    type: 'user' | 'user-choice' | 'system' | 'room-name' | 'room-desc' | 'choices-data', 
    content: string; 
    className?: string;
    fullContent?: string;
  }>>([])
  const [choices, setChoices] = useState<any[]>([])
  const [inventory, setInventory] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentScene, setCurrentScene] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [hasImportedData, setHasImportedData] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  const [sceneHistory, setSceneHistory] = useState<Array<{ id: string; name: string; timestamp: string; action: string }>>([])
  const outputRef = useRef<HTMLDivElement>(null)

  // 使用新的导航钩子
  const { navigateToValidator, navigateToGameEditor } = useAppNavigation()

  // 使用导出通知钩子
  const { notifications, addNotification, removeNotification, NotificationContainer } = useExportNotifications()

  // 故事数据
  const [storyData, setStoryData] = useState<any>({
    start: 'foyer',
    scenes: {
      foyer: {
        id: 'foyer',
        name: '大厅',
        desc: '**欢迎来到文本冒险游戏！**\n\n这是一个演示场景，展示了文本引擎的核心功能。\n\n你可以使用以下命令：\n- **观察** 或 **LOOK** - 查看当前场景\n- **北** 或 **GO 北** - 向北移动\n- **物品** 或 **ITEMS** - 查看场景中的物品\n- **背包** 或 **INV** - 查看你的物品栏\n- **帮助** 或 **HELP** - 查看所有可用命令',
        img: '',
        exits: [
          { dir: 'north', id: 'reception' }
        ],
        items: [
          { name: '高大的窗户', desc: '透过窗户，你可以看到外面美丽的风景。' },
          { name: '古老的挂钟', desc: '挂钟滴答作响，显示着当前时间。' }
        ]
      },
      reception: {
        id: 'reception',
        name: '接待处',
        desc: '**接待员** 站在柜台后面，微笑着向你打招呼。\n\n你可以使用 **TALK** 命令与角色交谈。\n\n向 **东** 是一扇关闭的 **门**，门上写着"实验室"。\n\n向 **南** 是你开始冒险的大厅。\n\n在 **柜台** 旁边是通往 **上** 的 **楼梯**。',
        exits: [
          { dir: 'east', id: 'lab' },
          { dir: 'south', id: 'foyer' },
          { dir: 'up', id: 'rooftop' }
        ],
        items: [
          { name: '柜台', desc: '一个木质柜台，上面放着一些文件。' },
          { name: '门', desc: '门上有金属字母钉着，拼写为："RESEARCH LAB".' },
          { name: '楼梯', desc: '通往楼上的木质楼梯。' }
        ]
      },
      lab: {
        id: 'lab',
        name: '实验室',
        desc: '实验室里有一个 **蓝色机器人** 静静地悬浮在中央。它似乎在等待指示。\n\n（输入 **TALK** 与机器人交谈。）\n\n实验室的墙上挂着一面 **镜子**，反射着你的身影。',
        exits: [
          { dir: 'west', id: 'reception' }
        ],
        items: [
          { name: '蓝色机器人', desc: '一个高科技机器人，闪烁着蓝色的灯光。' },
          { name: '镜子', desc: '一面普通的镜子，反射着实验室的景象。' }
        ]
      },
      rooftop: {
        id: 'rooftop',
        name: '屋顶',
        desc: '**你来到了屋顶！**\n\n从这里可以看到整个城市的景色。\n\n微风吹过，让你感到心旷神怡。\n\n这是演示的最后一个场景，你可以 **向下** 返回接待处。',
        exits: [
          { dir: 'down', id: 'reception' }
        ],
        items: [
          { name: '望远镜', desc: '一个天文望远镜，可以观察星空。' },
          { name: '花园', desc: '屋顶上的小花园，种着各种花草。' }
        ]
      }
    }
  })

  // 修复 Hydration 错误：确保组件只在客户端渲染
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 检查localStorage中是否有导入的游戏数据
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const importedData = localStorage.getItem('importedGameData')
      if (importedData) {
        try {
          const data = JSON.parse(importedData)
          if (data.scenes && data.start) {
            setStoryData(data)
            setHasImportedData(true)
            localStorage.removeItem('importedGameData')
          }
        } catch (error) {
          console.error('Failed to load imported game data:', error)
        }
      }
    }
  }, [])

  // 检查sessionStorage中是否有JSON验证器传递的游戏数据
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const gameData = sessionStorage.getItem('gameData')
      if (gameData) {
        try {
          const data = JSON.parse(gameData)
          if (data.game_title && data.branches && Array.isArray(data.branches)) {
            console.log('从JSON验证器加载游戏数据')
            
            // 清空输出历史
            setOutputHistory([])
            setInventory([])
            setChoices([])
            
            // 找到起始分支（第一个分支）
            const startBranch = data.branches[0]
            if (startBranch) {
              // 设置当前场景
              const newScene = {
                id: startBranch.branch_id,
                name: startBranch.chapter || startBranch.branch_id,
                desc: startBranch.scene_detail || '',
                exits: startBranch.choices?.map((choice: any) => ({
                  text: choice.choice,
                  target: choice.next_branch,
                  effect: choice.effect,
                  status_update: choice.status_update,
                  end_game: choice.end_game
                })) || []
              }
              setCurrentScene(newScene)
              setChoices(newScene.exits)
              
              // 添加场景信息到输出历史
              setOutputHistory([
                { type: 'room-name', content: data.game_title, className: 'room-name', fullContent: data.game_title },
                { type: 'room-desc', content: data.description || '', fullContent: data.description || '' },
                { type: 'room-name', content: startBranch.chapter || startBranch.branch_id, className: 'room-name', fullContent: startBranch.chapter || startBranch.branch_id },
                { type: 'room-desc', content: startBranch.scene_detail || '', fullContent: startBranch.scene_detail || '' }
              ])
              
              // 保存游戏数据以便后续使用
              setStoryData({
                start: startBranch.branch_id,
                scenes: data.branches.reduce((acc: any, branch: any) => {
                  acc[branch.branch_id] = {
                    id: branch.branch_id,
                    name: branch.chapter || branch.branch_id,
                    desc: branch.scene_detail || '',
                    exits: branch.choices?.map((choice: any) => ({
                      text: choice.choice,
                      target: choice.next_branch,
                      effect: choice.effect,
                      status_update: choice.status_update,
                      end_game: choice.end_game
                    })) || []
                  }
                  return acc
                }, {})
              })
              
              setShowWelcome(false)
              sessionStorage.removeItem('gameData')
            }
          }
        } catch (error) {
          console.error('Failed to load game data from sessionStorage:', error)
        }
      }
    }
  }, [])

  // 当storyData更新时，自动开始游戏（如果有导入的数据）
  useEffect(() => {
    if (isClient && hasImportedData && storyData && storyData.scenes && storyData.start) {
      setShowWelcome(false)
      const initialScene = storyData.scenes[storyData.start]
      if (initialScene) {
        setCurrentScene(initialScene)
        setChoices(initialScene.exits || [])
        setOutputHistory([
          { type: 'room-name', content: initialScene.name, className: 'room-name', fullContent: initialScene.name },
          { type: 'room-desc', content: initialScene.desc, fullContent: initialScene.desc }
        ])
      }
    }
  }, [isClient, hasImportedData, storyData])

  // 缓慢优雅下滑的效果
  const scrollToBottom = () => {
    if (showWelcome) return
    setTimeout(() => {
      const scrollHeight = document.body.scrollHeight || document.documentElement.scrollHeight
      window.scrollTo({
        top: scrollHeight,
        behavior: 'smooth'
      })
    }, 100)
  }

  // 英文方向到中文的映射
  const directionToChinese: Record<string, string> = {
    'north': '北',
    'south': '南',
    'east': '东',
    'west': '西',
    'up': '上',
    'down': '下',
    'n': '北',
    's': '南',
    'e': '东',
    'w': '西',
    'u': '上',
    'd': '下'
  }

  const executeCommand = (cmd: string) => {
    if (typeof cmd !== 'string') return

    const trimmedCmd = cmd.trim()
    
    // 中文命令映射
    const chineseCommandMap: Record<string, string> = {
      '观察': 'look',
      '查看': 'look',
      '看': 'look',
      '物品': 'items',
      '查看物品': 'items',
      '背包': 'inv',
      '查看背包': 'inv',
      '帮助': 'help',
      '保存': 'save',
      '读取': 'load',
      '加载': 'load',
      '清除': 'clear',
      '清空': 'clear',
      '北': 'north',
      '南': 'south',
      '东': 'east',
      '西': 'west',
      '上': 'up',
      '下': 'down',
      '去北': 'go north',
      '去南': 'go south',
      '去东': 'go east',
      '去西': 'go west',
      '去上': 'go up',
      '去下': 'go down',
      '向北': 'go north',
      '向南': 'go south',
      '向东': 'go east',
      '向西': 'go west',
      '向上': 'go up',
      '向下': 'go down',
      '去北方': 'go north',
      '去南方': 'go south',
      '去东方': 'go east',
      '去西方': 'go west',
      '向上方': 'go up',
      '向下方': 'go down'
    }

    // 中文方向映射
    const chineseDirMap: Record<string, string> = {
      '北': 'north',
      '南': 'south',
      '东': 'east',
      '西': 'west',
      '上': 'up',
      '下': 'down'
    }

    // 模糊匹配中文命令
    let matchedCommand = trimmedCmd.toLowerCase()
    
    // 检查是否是中文命令
    for (const [chinese, english] of Object.entries(chineseCommandMap)) {
      if (trimmedCmd.includes(chinese) || trimmedCmd.toLowerCase() === chinese.toLowerCase()) {
        matchedCommand = english
        break
      }
    }

    // 立即添加用户命令到输出历史
    setOutputHistory(prev => [...prev, { type: 'user', content: `> ${cmd}` }])

    switch (matchedCommand) {
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
          scrollToBottom()
        }
        break

      case 'help':
        setOutputHistory(prev => [...prev, { type: 'system', content: '可用命令：\n  LOOK/观察 - 观察四周\n  ITEMS/物品 - 列出房间内的物品\n  INV/背包 - 检查你的背包\n  HELP/帮助 - 显示此帮助消息\n  GO 北/去北 - 向北移动', fullContent: '可用命令：\n  LOOK/观察 - 观察四周\n  ITEMS/物品 - 列出房间内的物品\n  INV/背包 - 检查你的背包\n  HELP/帮助 - 显示此帮助消息\n  GO 北/去北 - 向北移动' }])
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
        setOutputHistory([])
        setInventory([])
        setChoices([])
        setSceneHistory([])
        
        if (storyData && storyData.scenes && storyData.start) {
          const initialScene = storyData.scenes[storyData.start]
          if (initialScene) {
            setCurrentScene(initialScene)
            setChoices(initialScene.exits || [])
            setOutputHistory([
              { type: 'room-name', content: initialScene.name, className: 'room-name', fullContent: initialScene.name },
              { type: 'room-desc', content: initialScene.desc, fullContent: initialScene.desc }
            ])
          }
        }
        break

      default:
        const dirMap: Record<string, string> = {
          'n': 'north', 's': 'south', 'e': 'east', 'w': 'west',
          'north': 'north', 'south': 'south', 'east': 'east', 'west': 'west',
          'up': 'up', 'down': 'down', 'u': 'up', 'd': 'down'
        }

        let matchedDir: string | null = null
        const commandLower = matchedCommand.toLowerCase()
        const trimmedCmdLower = trimmedCmd.toLowerCase()

        let matchedChoice: any | null = null

        if (choices.length > 0) {
          for (const choice of choices) {
            const directionName = Array.isArray(choice.dir) ? choice.dir[0] : choice.dir
            const choiceText = choice.text || directionName
            const directionChinese = choiceText ? (directionToChinese[choiceText.toLowerCase()] || choiceText) : '未知'
            const directionChineseLower = directionChinese.toLowerCase()
            const choiceTextLower = choiceText?.toLowerCase() || ''
            const directionNameLower = directionName?.toLowerCase() || ''

            if (trimmedCmdLower.includes(directionChineseLower) ||
                trimmedCmdLower.includes(choiceTextLower) ||
                trimmedCmdLower.includes(directionNameLower) ||
                directionChineseLower.includes(trimmedCmdLower) ||
                choiceTextLower.includes(trimmedCmdLower) ||
                directionNameLower.includes(trimmedCmdLower)) {
              matchedChoice = choice
              break
            }
          }
        }

        if (matchedChoice) {
          const directionName = Array.isArray(matchedChoice.dir) ? matchedChoice.dir[0] : matchedChoice.dir
          const choiceText = matchedChoice.text || directionName
          const directionChinese = choiceText ? (directionToChinese[choiceText.toLowerCase()] || choiceText) : '未知'
          const targetSceneId = matchedChoice.target || matchedChoice.id
          const displayText = `> ${directionChinese}`
          setOutputHistory(prev => [...prev, { type: 'user-choice', content: displayText }])
          moveToScene(targetSceneId, directionChinese)
          return
        }

        for (const [key, dir] of Object.entries(dirMap)) {
          if (commandLower === key || commandLower.startsWith(key + ' ') || commandLower.startsWith('go ' + key)) {
            matchedDir = dir
            break
          }
        }

        if (!matchedDir) {
          for (const [chinese, dir] of Object.entries(chineseDirMap)) {
            if (trimmedCmd.includes(chinese) || trimmedCmd.toLowerCase().includes(chinese.toLowerCase())) {
              matchedDir = dir
              break
            }
          }
        }

        if (matchedDir) {
          if (currentScene && currentScene.exits) {
            const exit = currentScene.exits.find((e: any) => {
              const exitDir = Array.isArray(e.dir) ? e.dir[0] : e.dir
              const exitText = e.text || exitDir
              return exitText && exitText.toLowerCase() === matchedDir
            })
            if (exit) {
              const exitDir = Array.isArray(exit.dir) ? exit.dir[0] : exit.dir
              const exitText = exit.text || exitDir
              const directionChinese = exitText ? (directionToChinese[exitText.toLowerCase()] || exitText) : matchedDir
              const choiceText = `> ${directionChinese}`
              setOutputHistory(prev => [...prev, { type: 'user-choice', content: choiceText }])
              const targetSceneId = exit.target || exit.id
              moveToScene(targetSceneId, `${directionChinese}`)
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
    try {
      if (typeof sceneId !== 'string' || !sceneId.trim()) {
        throw new Error('无效的场景ID')
      }

      const newScene = storyData.scenes[sceneId]
      if (!newScene) {
        throw new Error(`无法找到目标场景: ${sceneId}`)
      }

      setCurrentScene(newScene)
      setChoices(newScene.exits || [])

      // 添加场景名称和描述（一次性添加）
      setOutputHistory(prev => [...prev, 
        { type: 'room-name', content: newScene.name, className: 'room-name', fullContent: newScene.name },
        { type: 'room-desc', content: newScene.desc, fullContent: newScene.desc }
      ])

      setInventory(prev => [...prev, ...(newScene.items || []).map((i: any) => Array.isArray(i.name) ? i.name[0] : i.name)])

      // 添加到场景历史记录
      setSceneHistory(prev => [...prev, {
        id: newScene.id,
        name: newScene.name,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        action: command
      }])
    } catch (error) {
      // 输出清晰的错误信息
      const errorMessage = error instanceof Error ? error.message : '发生未知错误'
      
      // 1. 输出清晰的效果说明和结果描述
      setOutputHistory(prev => [...prev, 
        { 
          type: 'system', 
          content: `⚠️  场景跳转异常：${errorMessage}\n\n系统正在重新加载当前场景的可选分支...`, 
          fullContent: `⚠️  场景跳转异常：${errorMessage}\n\n系统正在重新加载当前场景的可选分支...` 
        }
      ])
      
      // 2. 自动触发当前场景下所有可选分支的重新加载机制
      if (currentScene) {
        // 重新设置当前场景的选择，确保玩家能够重新选择有效的游戏分支
        setChoices(currentScene.exits || [])
        
        // 添加调试信息，显示当前场景的所有可选分支
        const availableChoices = currentScene.exits || []
        if (availableChoices.length > 0) {
          const choicesText = availableChoices.map((choice: any, index: number) => {
            const choiceText = choice.text || choice.dir || '未知选项'
            return `${index + 1}. ${choiceText}`
          }).join('\n')
          
          setTimeout(() => {
            setOutputHistory(prev => [...prev, 
              { 
                type: 'system', 
                content: `✅ 当前场景可用分支：\n${choicesText}`, 
                fullContent: `✅ 当前场景可用分支：\n${choicesText}` 
              }
            ])
            scrollToBottom()
          }, 1000)
        }
      }
      
      // 3. 确保游戏流程的连续性，不更新当前场景，维持现有状态
      // 不修改 currentScene，保持当前场景不变
      
      scrollToBottom()
    }
  }

  // 导出 JSON 功能（仅导出 JSON 数据）
  const exportJson = async () => {
    try {
      addNotification('正在导出游戏数据...', 'info')
      const result = await exportJsonFile('game-data.json', storyData)
      if (result.success) {
        addNotification(`游戏数据导出成功！`, 'success')
      } else {
        addNotification(`导出失败: ${result.error}`, 'error')
        console.error('导出失败:', result.error)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '导出失败'
      addNotification(`导出失败: ${errorMessage}`, 'error')
      console.error('导出JSON失败:', error)
    }
  }

  // 导出进度功能
  const exportProgress = async () => {
    try {
      addNotification('正在导出游戏进度...', 'info')
      const data = {
        ...storyData,
        playerState: {
          scene: currentScene?.id,
          inventory: inventory,
          history: outputHistory,
          choices: choices,
          timestamp: new Date().toISOString()
        }
      }
      
      const result = await exportJsonFile('game-progress.json', data)
      if (result.success) {
        addNotification(`游戏进度导出成功！`, 'success')
      } else {
        addNotification(`导出失败: ${result.error}`, 'error')
        console.error('导出进度失败:', result.error)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '导出失败'
      addNotification(`导出失败: ${errorMessage}`, 'error')
      console.error('导出进度失败:', error)
    }
  }

  // 导出 txt 功能
  const exportTxt = async () => {
    try {
      addNotification('正在导出游戏日志...', 'info')
      const text = outputHistory.map(item => item.fullContent || item.content).join('\n\n')
      const result = await exportTextFile('game-log.txt', text)
      if (result.success) {
        addNotification(`游戏日志导出成功！`, 'success')
      } else {
        addNotification(`导出失败: ${result.error}`, 'error')
        console.error('导出TXT失败:', result.error)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '导出失败'
      addNotification(`导出失败: ${errorMessage}`, 'error')
      console.error('导出TXT失败:', error)
    }
  }

  // 导入 JSON 功能
  const importJson = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        
        // 识别JSON的格式
        if (data.scenes && data.start) {
          // 标准格式：{ start, scenes }
          console.log('检测到标准JSON格式')
          
          // 更新故事数据
          setStoryData(data)
          
          // 清空输出历史
          setOutputHistory([])
          setInventory([])
          setChoices([])
          
          // 找到起始场景
          const startScene = data.scenes[data.start]
          if (startScene) {
            setCurrentScene(startScene)
            setChoices(startScene.exits || [])
            
            // 添加房间信息到输出历史
            setOutputHistory([
              { type: 'room-name', content: startScene.name, className: 'room-name', fullContent: startScene.name },
              { type: 'room-desc', content: startScene.desc, fullContent: startScene.desc }
            ])
            
            // 显示导入成功消息
            setTimeout(() => {
              setOutputHistory(prev => [...prev, { type: 'system', content: '游戏导入成功！', fullContent: '游戏导入成功！' }])
              scrollToBottom()
            }, 500)
          } else {
            setOutputHistory([
              { type: 'system', content: '无法找到起始场景：' + data.start, fullContent: '无法找到起始场景：' + data.start }
            ])
            scrollToBottom()
          }
        } else if (data.playerId && data.rooms) {
          // 用户提供的JSON格式：{ playerId, playerName, rooms }
          console.log('检测到用户提供的JSON格式')
          
          // 清空输出历史
          setOutputHistory([])
          setInventory([])
          setChoices([])
          
          // 找到起始房间
          const startRoom = data.rooms.find((room: any) => room.id === data.playerId)
          if (startRoom) {
            // 处理房间描述（可能是数组）
            const desc = Array.isArray(startRoom.desc) ? startRoom.desc.join('\n\n') : startRoom.desc
            
            // 设置当前场景
            const newScene = {
              id: startRoom.id,
              name: startRoom.name,
              desc: desc,
              exits: startRoom.exits,
              items: startRoom.items
            }
            setCurrentScene(newScene)
            setChoices(startRoom.exits || [])
            
            // 添加房间信息到输出历史
            setOutputHistory([
              { type: 'room-name', content: startRoom.name, className: 'room-name', fullContent: startRoom.name },
              { type: 'room-desc', content: desc, fullContent: desc }
            ])
            
            // 显示导入成功消息
            setTimeout(() => {
              setOutputHistory(prev => [...prev, { type: 'system', content: '游戏导入成功！', fullContent: '游戏导入成功！' }])
              scrollToBottom()
            }, 500)
          } else {
            setOutputHistory([
              { type: 'system', content: '无法找到起始房间：' + data.playerId, fullContent: '无法找到起始房间：' + data.playerId }
            ])
            scrollToBottom()
          }
        } else if (data.scene && data.inventory) {
          // 我们期望的JSON格式：{ scene, inventory, history, choices }
          console.log('检测到我们期望的JSON格式')
          
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
          if (data.history) {
            setOutputHistory(data.history)
          }
          
          // 显示导入成功消息
          setTimeout(() => {
            setOutputHistory(prev => [...prev, { type: 'system', content: '游戏导入成功！', fullContent: '游戏导入成功！' }])
            scrollToBottom()
          }, 500)
        } else if (data.playerState) {
          // 游戏进度格式：{ ...storyData, playerState: { scene, inventory, history, choices, timestamp } }
          console.log('检测到游戏进度格式')
          
          // 恢复故事数据
          const { playerState, ...gameData } = data
          setStoryData(gameData)
          
          // 恢复玩家状态
          if (playerState.scene) {
            const newScene = gameData.scenes[playerState.scene]
            if (newScene) {
              setCurrentScene(newScene)
              setChoices(newScene.exits || [])
            }
          }
          if (playerState.inventory) {
            setInventory(playerState.inventory)
          }
          if (playerState.history) {
            setOutputHistory(playerState.history)
          }
          
          // 显示导入成功消息
          setTimeout(() => {
            setOutputHistory(prev => [...prev, { type: 'system', content: '游戏进度导入成功！', fullContent: '游戏进度导入成功！' }])
            scrollToBottom()
          }, 500)
        } else if (data.game_title && data.branches && Array.isArray(data.branches)) {
          // 新的游戏文件格式：{ game_title, description, status, branches }
          console.log('检测到新游戏文件格式')
          
          // 清空输出历史
          setOutputHistory([])
          setInventory([])
          setChoices([])
          
          // 找到起始分支（第一个分支）
          const startBranch = data.branches[0]
          if (startBranch) {
            // 设置当前场景
            const newScene = {
              id: startBranch.branch_id,
              name: startBranch.chapter || startBranch.branch_id,
              desc: startBranch.scene_detail || '',
              exits: startBranch.choices?.map((choice: any) => ({
                text: choice.choice,
                target: choice.next_branch,
                effect: choice.effect,
                status_update: choice.status_update,
                end_game: choice.end_game
              })) || []
            }
            setCurrentScene(newScene)
            setChoices(newScene.exits)
            
            // 添加场景信息到输出历史
            setOutputHistory([
              { type: 'room-name', content: data.game_title, className: 'room-name', fullContent: data.game_title },
              { type: 'room-desc', content: data.description || '', fullContent: data.description || '' },
              { type: 'room-name', content: startBranch.chapter || startBranch.branch_id, className: 'room-name', fullContent: startBranch.chapter || startBranch.branch_id },
              { type: 'room-desc', content: startBranch.scene_detail || '', fullContent: startBranch.scene_detail || '' }
            ])
            
            // 保存游戏数据以便后续使用
            setStoryData({
              start: startBranch.branch_id,
              scenes: data.branches.reduce((acc: any, branch: any) => {
                acc[branch.branch_id] = {
                  id: branch.branch_id,
                  name: branch.chapter || branch.branch_id,
                  desc: branch.scene_detail || '',
                  exits: branch.choices?.map((choice: any) => ({
                    text: choice.choice,
                    target: choice.next_branch,
                    effect: choice.effect,
                    status_update: choice.status_update,
                    end_game: choice.end_game
                  })) || []
                }
                return acc
              }, {})
            })
            
            // 显示导入成功消息
            setTimeout(() => {
              setOutputHistory(prev => [...prev, { type: 'system', content: '游戏导入成功！', fullContent: '游戏导入成功！' }])
              scrollToBottom()
            }, 500)
          } else {
            setOutputHistory([
              { type: 'system', content: '无法找到起始分支', fullContent: '无法找到起始分支' }
            ])
            scrollToBottom()
          }
        } else {
          // 无法识别的JSON格式
          console.log('无法识别的JSON格式')
          setOutputHistory([
            { type: 'system', content: '无法识别的JSON格式。请提供有效的游戏文件。', fullContent: '无法识别的JSON格式。请提供有效的游戏文件。' }
          ])
          scrollToBottom()
        }
      } catch (error) {
        console.error('JSON解析错误：', error)
        setOutputHistory([
          { type: 'system', content: '游戏导入失败：无效的 JSON', fullContent: '游戏导入失败：无效的 JSON' }
        ])
        scrollToBottom()
      }
    }
    reader.readAsText(file)
  }

  // 只在需要时滚动到底部（例如在开始游戏时）
  useEffect(() => {
    if (showWelcome) return
    if (outputHistory.length === 0 || outputHistory.length === 2) {
      // 只在开始游戏时滚动到底部
      setTimeout(() => {
        const scrollHeight = document.body.scrollHeight || document.documentElement.scrollHeight
        window.scrollTo({
          top: scrollHeight,
          behavior: 'smooth'
        })
      }, 100)
    }
  }, [outputHistory, showWelcome])

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
      <NotificationContainer />
      {showEditor && (
        <div className="fixed inset-0 z-50">
          <iframe
            src="/game-editor"
            className="w-full h-full border-0"
            title="Game Editor"
          />
        </div>
      )}
      
      {isProcessing && (
        <div className="h-1 bg-indigo-600 w-full fixed top-0 left-0 animate-pulse z-20" />
      )}

      {showWelcome && (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 flex flex-col items-center justify-start text-center p-4 sm:p-8 z-50 overflow-y-auto relative" suppressHydrationWarning>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/5 via-purple-400/5 to-pink-400/5 backdrop-blur-sm"></div>
          <div className="w-full max-w-2xl mx-auto pt-6 sm:pt-10 lg:pt-12 relative z-10">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-indigo-500/10 p-4 sm:p-6 lg:p-8 mb-4 sm:mb-5 border border-white/50">
                <div className="mb-5 sm:mb-6">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 sm:mb-3 tracking-tight leading-tight" suppressHydrationWarning>
                    文本引擎
                  </h1>
                  <div className="w-16 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mx-auto rounded-full shadow-lg shadow-indigo-500/30"></div>
                </div>
                
                <p className="text-slate-600 text-base sm:text-lg lg:text-xl mb-3 sm:mb-4 leading-relaxed tracking-wide" suppressHydrationWarning>
                  使用这个引擎，你可以制作自己的文字冒险游戏
                </p>
                <p className="text-slate-500 text-sm sm:text-base lg:text-lg mb-1.5 sm:mb-2 leading-relaxed" suppressHydrationWarning>
                  支持 <span className="text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text font-semibold">中文</span> 和 <span className="text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text font-semibold">英文</span> 命令
                </p>
                <p className="text-slate-500 text-sm sm:text-base lg:text-lg leading-relaxed" suppressHydrationWarning>
                  输入 <span className="text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text font-semibold">观察</span> 或 <span className="text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text font-semibold">LOOK</span> 查看四周
                </p>
              </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-indigo-500/10 p-4 sm:p-6 lg:p-8 mb-4 sm:mb-5 border border-white/50">
              <button
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-bold px-6 sm:px-8 py-3.5 sm:py-4 lg:py-5 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 active:scale-95 text-base sm:text-lg lg:text-xl"
                onClick={() => {
                  setShowWelcome(false)
                  const initialScene = storyData.scenes[storyData.start]
                  setCurrentScene(initialScene)
                  setChoices(initialScene.exits || [])
                  setOutputHistory([
                    { type: 'room-name', content: initialScene.name, className: 'room-name', fullContent: initialScene.name },
                    { type: 'room-desc', content: initialScene.desc, fullContent: initialScene.desc }
                  ])
                }}
              >
                🚀 开始游戏
              </button>
              <button
                className="w-full mt-3 sm:mt-4 bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all duration-300 font-bold px-6 sm:px-8 py-3.5 sm:py-4 lg:py-5 rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 active:scale-95 text-base sm:text-lg lg:text-xl"
                onClick={navigateToGameEditor}
              >
                📝 文本游戏制作
              </button>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-indigo-500/10 p-4 sm:p-6 lg:p-8 mb-4 sm:mb-5 border border-white/50">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 sm:mb-4">选择示例故事</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <button
                  onClick={async () => {
                    try {
                      // 从public目录加载JSON文件
                      const response = await fetch('/一个帽子_修复版.json');
                      const data = await response.json();
                      
                      // 清空输出历史
                      setOutputHistory([]);
                      setInventory([]);
                      setChoices([]);
                      
                      // 找到起始分支（第一个分支）
                      const startBranch = data.branches[0];
                      if (startBranch) {
                        // 设置当前场景
                        const newScene = {
                          id: startBranch.branch_id,
                          name: startBranch.chapter || startBranch.branch_id,
                          desc: startBranch.scene_detail || '',
                          exits: startBranch.choices?.map((choice: any) => ({
                            text: choice.choice,
                            target: choice.next_branch,
                            effect: choice.effect,
                            status_update: choice.status_update,
                            end_game: choice.end_game
                          })) || []
                        };
                        setCurrentScene(newScene);
                        setChoices(newScene.exits);
                        
                        // 添加场景信息到输出历史
                        setOutputHistory([
                          { type: 'room-name', content: data.game_title, className: 'room-name', fullContent: data.game_title },
                          { type: 'room-desc', content: data.description || '', fullContent: data.description || '' },
                          { type: 'room-name', content: startBranch.chapter || startBranch.branch_id, className: 'room-name', fullContent: startBranch.chapter || startBranch.branch_id },
                          { type: 'room-desc', content: startBranch.scene_detail || '', fullContent: startBranch.scene_detail || '' }
                        ]);
                        
                        // 保存游戏数据以便后续使用
                        setStoryData({
                          start: startBranch.branch_id,
                          scenes: data.branches.reduce((acc: any, branch: any) => {
                            acc[branch.branch_id] = {
                              id: branch.branch_id,
                              name: branch.chapter || branch.branch_id,
                              desc: branch.scene_detail || '',
                              exits: branch.choices?.map((choice: any) => ({
                                text: choice.choice,
                                target: choice.next_branch,
                                effect: choice.effect,
                                status_update: choice.status_update,
                                end_game: choice.end_game
                              })) || []
                            };
                            return acc;
                          }, {})
                        });
                        
                        // 关闭欢迎界面，开始游戏
                        setShowWelcome(false);
                      }
                    } catch (error) {
                      console.error('加载示例故事失败:', error);
                      setOutputHistory([
                        { type: 'system', content: '加载示例故事失败，请重试。', fullContent: '加载示例故事失败，请重试。' }
                      ]);
                      setShowWelcome(false);
                    }
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-bold px-4 sm:px-5 py-3 sm:py-4 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 active:scale-95 text-sm sm:text-base"
                >
                  示例故事1
                </button>
                <button
                  onClick={() => {
                    // 示例故事2 - 暂时显示提示
                    alert('示例故事2即将推出！');
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-bold px-4 sm:px-5 py-3 sm:py-4 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 active:scale-95 text-sm sm:text-base"
                >
                  示例故事2
                </button>
                <button
                  onClick={() => {
                    // 示例故事3 - 暂时显示提示
                    alert('示例故事3即将推出！');
                  }}
                  className="bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-700 hover:to-teal-700 transition-all duration-300 font-bold px-4 sm:px-5 py-3 sm:py-4 rounded-xl shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 active:scale-95 text-sm sm:text-base"
                >
                  示例故事3
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-5">
              <button
                onClick={() => {
                  const data = JSON.stringify(storyData, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'example-story.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="bg-transparent text-purple-600 hover:text-purple-700 border-2 border-purple-600 hover:border-purple-700 transition-all duration-300 font-bold px-3 sm:px-4 py-2.5 sm:py-3 lg:py-4 rounded-xl shadow-sm hover:shadow-md active:scale-95"
              >
                📄 示例JSON
              </button>
              <button
                onClick={() => window.open('JSON-GUIDE.html', '_blank')}
                className="bg-transparent text-purple-600 hover:text-purple-700 border-2 border-purple-600 hover:border-purple-700 transition-all duration-300 font-bold px-3 sm:px-4 py-2.5 sm:py-3 lg:py-4 rounded-xl shadow-sm hover:shadow-md active:scale-95"
              >
                🚀 星际探索
              </button>
              <button
                onClick={() => window.open('USER-GUIDE.html', '_blank')}
                className="bg-transparent text-purple-600 hover:text-purple-700 border-2 border-purple-600 hover:border-purple-700 transition-all duration-300 font-bold px-3 sm:px-4 py-2.5 sm:py-3 lg:py-4 rounded-xl shadow-sm hover:shadow-md active:scale-95"
              >
                📚 用户指南
              </button>
              <button
                onClick={() => window.open('/validator', '_blank')}
                className="bg-transparent text-purple-600 hover:text-purple-700 border-2 border-purple-600 hover:border-purple-700 transition-all duration-300 font-bold px-3 sm:px-4 py-2.5 sm:py-3 lg:py-4 rounded-xl shadow-sm hover:shadow-md active:scale-95"
              >
                ✅ JSON验证器
              </button>
              <button
                onClick={navigateToValidator}
                className="bg-transparent text-emerald-600 hover:text-emerald-700 border-2 border-emerald-600 hover:border-emerald-700 transition-all duration-300 font-bold px-3 sm:px-4 py-2.5 sm:py-3 lg:py-4 rounded-xl shadow-sm hover:shadow-md active:scale-95"
              >
                🎯 增强验证器
              </button>
            </div>

            <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-pink-50/80 backdrop-blur-xl rounded-2xl p-4 sm:p-5 lg:p-6 border border-white/50 shadow-lg shadow-indigo-500/5">
              <h3 className="text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text font-semibold text-base sm:text-lg lg:text-xl mb-3 sm:mb-4 flex items-center gap-2">
                <span>🚀</span> 快速开始指南
              </h3>
              <div className="text-left space-y-1.5 sm:space-y-2 text-sm sm:text-base lg:text-lg text-slate-600">
                <p><span className="font-medium text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text">1. 开始游戏：</span>点击主按钮，立即开始冒险</p>
                <p><span className="font-medium text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text">2. 探索世界：</span>使用 <span className="bg-white/80 px-2 py-0.5 rounded text-xs font-medium">观察</span> 或 <span className="bg-white/80 px-2 py-0.5 rounded text-xs font-medium">LOOK</span> 查看，<span className="bg-white/80 px-2 py-0.5 rounded text-xs font-medium">北</span> 或 <span className="bg-white/80 px-2 py-0.5 rounded text-xs font-medium">GO 北</span> 移动</p>
                <p><span className="font-medium text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text">3. 互动操作：</span><span className="bg-white/80 px-2 py-0.5 rounded text-xs font-medium">物品</span> 或 <span className="bg-white/80 px-2 py-0.5 rounded text-xs font-medium">ITEMS</span> 查看物品，<span className="bg-white/80 px-2 py-0.5 rounded text-xs font-medium">背包</span> 或 <span className="bg-white/80 px-2 py-0.5 rounded text-xs font-medium">INV</span> 查看背包</p>
                <p><span className="font-medium text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text">4. 对话系统：</span><span className="bg-white/80 px-2 py-0.5 rounded text-xs font-medium">TALK TO 角色名</span> 与NPC交流</p>
                <p><span className="font-medium text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text">5. 自定义故事：</span>下载示例JSON → 修改 → 导入 → 开始冒险！</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!showWelcome && !showEditor && (
        <div className="flex flex-col min-h-screen w-full bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 relative overflow-hidden" suppressHydrationWarning>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/5 via-purple-400/5 to-pink-400/5 backdrop-blur-sm"></div>
          <div className="bg-white/90 backdrop-blur-xl border-b border-white/50 sticky top-0 z-10 shadow-lg shadow-indigo-500/5 relative pt-[env(safe-area-inset-top)]" suppressHydrationWarning>
            <div className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-2 lg:gap-4">
                <h1 className="text-sm sm:text-lg lg:text-2xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight flex items-center gap-1 sm:gap-1.5 whitespace-nowrap" suppressHydrationWarning>
                  <span className="text-sm sm:text-xl lg:text-3xl">🎮</span>
                  <span className="hidden xs:inline">文本引擎</span>
                </h1>
                
                <div className="w-full lg:w-auto overflow-x-auto lg:overflow-visible scrollbar-hide" suppressHydrationWarning>
                  <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 min-w-max lg:min-w-0 justify-center lg:justify-end" suppressHydrationWarning>
                    <div className="relative shrink-0">
                      <label className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 transition-all duration-300 font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm flex items-center gap-1 cursor-pointer shadow-sm hover:shadow-md active:scale-95 touch-manipulation h-9 sm:h-10" style={{ minHeight: '36px' }}>
                        <span className="text-sm sm:text-base">📥</span>
                        <span className="hidden sm:inline">导入</span>
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
                    
                    <button
                      onClick={() => {
                        addNotification('正在导出游戏数据...', 'info')
                        const data = storyData
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = 'game-data.json'
                        a.click()
                        URL.revokeObjectURL(url)
                        addNotification('游戏数据导出成功！', 'success')
                      }}
                      className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 transition-all duration-300 font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm flex items-center gap-1 shadow-sm hover:shadow-md active:scale-95 touch-manipulation shrink-0 h-9 sm:h-10" style={{ minHeight: '36px' }}
                    >
                      <span className="text-sm sm:text-base">📤</span>
                      <span className="hidden sm:inline">导出</span>
                    </button>
                    
                    <a
                      href="https://simplefeedback.app/feedback/nDf7Lhk7Ohnw"
                      target="_blank"
                      className="bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 transition-all duration-300 font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm flex items-center gap-1 shadow-sm hover:shadow-md active:scale-95 touch-manipulation shrink-0 h-9 sm:h-10" style={{ minHeight: '36px' }}
                      suppressHydrationWarning
                    >
                      <span className="text-sm sm:text-base">💬</span>
                      <span className="hidden sm:inline">反馈</span>
                    </a>
                    
                    <button
                      onClick={navigateToValidator}
                      className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 transition-all duration-300 font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm flex items-center gap-1 shadow-sm hover:shadow-md active:scale-95 touch-manipulation shrink-0 h-9 sm:h-10" style={{ minHeight: '36px' }}
                      suppressHydrationWarning
                    >
                      <span className="text-sm sm:text-base">✓</span>
                      <span className="hidden sm:inline">验证</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowWelcome(true)
                        setOutputHistory([])
                        setCurrentScene(null)
                        setChoices([])
                      }}
                      className="bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 hover:border-slate-300 transition-all duration-300 font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm flex items-center gap-1 shadow-sm hover:shadow-md active:scale-95 touch-manipulation shrink-0 h-9 sm:h-10" style={{ minHeight: '36px' }}
                    >
                      <span className="text-sm sm:text-base">🏠</span>
                      <span className="hidden sm:inline">主页</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 输出区域 */}
          <div className="flex-grow overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-3 lg:space-y-4 font-sans text-slate-800 relative z-10" suppressHydrationWarning>
            <div ref={outputRef} className="min-h-[120px] sm:min-h-[180px] lg:min-h-[220px] max-w-4xl mx-auto" suppressHydrationWarning>
              {outputHistory.map((item, index) => {
                switch (item.type) {
                  case 'room-name':
                    return (
                      <div key={index} className="bg-gradient-to-br from-indigo-50/90 via-purple-50/90 to-pink-50/90 backdrop-blur-xl rounded-2xl p-4 sm:p-5 lg:p-6 mb-3 sm:mb-4 lg:mb-5 border border-white/60 shadow-xl shadow-indigo-500/10 hover:shadow-2xl hover:shadow-indigo-500/15 transition-all duration-300" suppressHydrationWarning>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight leading-tight" suppressHydrationWarning>
                          {item.content}
                        </h2>
                      </div>
                    )

                  case 'room-desc':
                    return (
                      <div key={index} className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 sm:p-5 lg:p-6 mb-3 sm:mb-4 lg:mb-5 border border-white/60 shadow-lg shadow-indigo-500/5 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 leading-relaxed text-slate-600 text-sm sm:text-base lg:text-lg xl:text-xl whitespace-pre-line" suppressHydrationWarning>
                        <TypewriterText text={item.fullContent || item.content} delay={10} onComplete={scrollToBottom} />
                      </div>
                    )

                  case 'user':
                    return (
                      <div key={index} className="bg-gradient-to-br from-indigo-50/90 to-indigo-100/90 backdrop-blur-xl rounded-2xl p-3 sm:p-4 lg:p-5 mb-2 sm:mb-3 lg:mb-4 border-l-4 border-indigo-500 shadow-lg shadow-indigo-500/10 hover:shadow-xl hover:shadow-indigo-500/15 transition-all duration-300" suppressHydrationWarning>
                        <div className="text-indigo-700 font-semibold text-sm sm:text-base lg:text-lg xl:text-xl flex items-center gap-1.5 sm:gap-2 lg:gap-3" suppressHydrationWarning>
                          <span className="text-sm sm:text-base lg:text-xl xl:text-2xl">👤</span>
                          <span className="leading-relaxed">{item.content}</span>
                        </div>
                      </div>
                    )

                  case 'system':
                    return (
                      <div key={index} className="bg-gradient-to-br from-slate-50/90 to-slate-100/90 backdrop-blur-xl rounded-2xl p-3 sm:p-4 lg:p-5 mb-2 sm:mb-3 lg:mb-4 border border-white/60 shadow-lg shadow-indigo-500/5 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300" suppressHydrationWarning>
                        <div className="text-slate-600 text-sm sm:text-base lg:text-lg xl:text-xl leading-relaxed" suppressHydrationWarning>
                          <TypewriterText text={item.fullContent || item.content} delay={8} onComplete={scrollToBottom} />
                        </div>
                      </div>
                    )

                  case 'user-choice':
                    return (
                      <div key={index} className="bg-gradient-to-br from-emerald-50/90 to-emerald-100/90 backdrop-blur-xl rounded-2xl p-3 sm:p-4 lg:p-5 mb-2 sm:mb-3 lg:mb-4 border-l-4 border-emerald-500 shadow-lg shadow-emerald-500/10 hover:shadow-xl hover:shadow-emerald-500/15 transition-all duration-300" suppressHydrationWarning>
                        <div className="text-emerald-700 font-semibold text-sm sm:text-base lg:text-lg xl:text-xl flex items-center gap-1.5 sm:gap-2 lg:gap-3" suppressHydrationWarning>
                          <span className="text-sm sm:text-base lg:text-xl xl:text-2xl">➡️</span>
                          <span className="leading-relaxed">{item.content}</span>
                        </div>
                      </div>
                    )

                  case 'choices-data':
                    return null

                  default:
                    return (
                      <div key={index} className="bg-gradient-to-br from-slate-50/90 to-slate-100/90 backdrop-blur-xl rounded-2xl p-2 sm:p-3 lg:p-4 mb-1.5 sm:mb-2 lg:mb-3 border border-white/60 shadow-lg shadow-indigo-500/5 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300" suppressHydrationWarning>
                        <div className="text-slate-600 text-xs sm:text-sm lg:text-base" suppressHydrationWarning>
                          {item.content}
                        </div>
                      </div>
                    )
                }
              })}
            </div>
          </div>

          {/* 动态选择按钮区域 */}
          <div className="p-4 sm:p-5 lg:p-6 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-t border-indigo-100 relative z-20" suppressHydrationWarning>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4 max-w-4xl mx-auto" suppressHydrationWarning>
              {choices.length > 0 ? (
                choices.map((choice: any, idx) => {
                  const directionName = Array.isArray(choice.dir) ? choice.dir[0] : choice.dir
                  const choiceText = choice.text || directionName
                  const directionChinese = choiceText ? (directionToChinese[choiceText.toLowerCase()] || choiceText) : '未知'
                  const targetSceneId = choice.target || choice.id
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setIsProcessing(true)
                        const displayText = `> ${directionChinese}`
                        setOutputHistory(prev => [...prev, { type: 'user-choice', content: displayText }])
                        
                        setTimeout(() => {
                          setIsProcessing(false)
                          moveToScene(targetSceneId, directionChinese)
                        }, 500)
                      }}
                      disabled={isProcessing}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-bold px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 lg:py-3.5 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[90px] sm:min-w-[100px] lg:min-w-[120px] touch-manipulation relative z-30"
                    >
                      <span className="leading-tight">{directionChinese}</span>
                    </button>
                  )
                })
              ) : null}
            </div>
          </div>

          {/* 快捷操作按钮 */}
          <div className="p-2.5 sm:p-4 lg:p-5 bg-gradient-to-br from-white/90 to-indigo-50/50 backdrop-blur-xl border-t border-b border-white/60 safe-area-pb" suppressHydrationWarning>
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2.5 lg:gap-3 max-w-4xl mx-auto" suppressHydrationWarning>
              <button onClick={() => executeCommand('look')} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 transition-all duration-300 font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center gap-1 shadow-sm hover:shadow-md active:scale-95 touch-manipulation shrink-0 h-8 sm:h-9" suppressHydrationWarning>
                <IconEye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">观察</span>
              </button>
              <button onClick={() => executeCommand('items')} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 transition-all duration-300 font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center gap-1 shadow-sm hover:shadow-md active:scale-95 touch-manipulation shrink-0 h-8 sm:h-9" suppressHydrationWarning>
                <IconBox className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">物品</span>
              </button>
              <button onClick={() => executeCommand('inv')} className="bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 transition-all duration-300 font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center gap-1 shadow-sm hover:shadow-md active:scale-95 touch-manipulation shrink-0 h-8 sm:h-9" suppressHydrationWarning>
                <IconInventory className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">背包</span>
              </button>
              <button onClick={() => executeCommand('help')} className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 transition-all duration-300 font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center gap-1 shadow-sm hover:shadow-md active:scale-95 touch-manipulation shrink-0 h-8 sm:h-9" suppressHydrationWarning>
                <IconHelp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">帮助</span>
              </button>
              <button onClick={() => executeCommand('save')} className="bg-cyan-50 text-cyan-600 hover:bg-cyan-100 border border-cyan-200 hover:border-cyan-300 transition-all duration-300 font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center gap-1 shadow-sm hover:shadow-md active:scale-95 touch-manipulation shrink-0 h-8 sm:h-9" suppressHydrationWarning>
                <IconSave className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">保存</span>
              </button>
              <button onClick={() => executeCommand('load')} className="bg-violet-50 text-violet-600 hover:bg-violet-100 border border-violet-200 hover:border-violet-300 transition-all duration-300 font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center gap-1 shadow-sm hover:shadow-md active:scale-95 touch-manipulation shrink-0 h-8 sm:h-9" suppressHydrationWarning>
                <IconLoad className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">读取</span>
              </button>
              <button onClick={() => executeCommand('clear')} className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 hover:border-red-300 transition-all duration-300 font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center gap-1 shadow-sm hover:shadow-md active:scale-95 touch-manipulation shrink-0 h-8 sm:h-9" suppressHydrationWarning>
                <IconDelete className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">清除</span>
              </button>
              <button onClick={() => setShowTimeline(!showTimeline)} className={`bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-300 transition-all duration-300 font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center gap-1 shadow-sm hover:shadow-md active:scale-95 touch-manipulation shrink-0 h-8 sm:h-9 ${showTimeline ? 'text-indigo-800' : 'text-slate-600'}`} suppressHydrationWarning>
                <IconScroll className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">时间线</span>
              </button>
            </div>
          </div>

          {/* 垂直时间线 */}
          {showTimeline && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" suppressHydrationWarning>
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" suppressHydrationWarning>
                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4 sm:p-6 flex items-center justify-between" suppressHydrationWarning>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3" suppressHydrationWarning>
                    <IconScroll className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />
                    剧情时间线
                  </h2>
                  <button onClick={() => setShowTimeline(false)} className="bg-transparent text-white border-2 border-white/50 hover:border-white transition-all duration-300 font-bold rounded-lg p-2 sm:p-2.5 shadow-sm hover:shadow-md active:scale-95">
                    <IconClose className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
                  </button>
                </div>
                <div className="p-4 sm:p-6 overflow-y-auto flex-grow" suppressHydrationWarning>
                  {sceneHistory.length === 0 ? (
                    <div className="text-center text-slate-500 py-8 sm:py-12 text-sm sm:text-base lg:text-lg" suppressHydrationWarning>
                      <span className="text-4xl sm:text-5xl lg:text-6xl block mb-3 sm:mb-4">📭</span>
                      暂无剧情记录
                    </div>
                  ) : (
                    <div className="relative" suppressHydrationWarning>
                      <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 rounded-full" suppressHydrationWarning></div>
                      {sceneHistory.map((item, index) => (
                        <div key={index} className="relative pl-10 sm:pl-14 pb-6 sm:pb-8 last:pb-0" suppressHydrationWarning>
                          <div className="absolute left-2 sm:left-3.5 top-1.5 sm:top-2 w-4 sm:w-5 h-4 sm:h-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full border-2 border-white shadow-lg shadow-indigo-500/30" suppressHydrationWarning></div>
                          <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-pink-50/80 backdrop-blur-xl rounded-xl p-3 sm:p-4 lg:p-5 border border-white/50 shadow-lg shadow-indigo-500/5 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300" suppressHydrationWarning>
                            <div className="flex items-center justify-between mb-2 sm:mb-3" suppressHydrationWarning>
                              <span className="text-xs sm:text-sm lg:text-base text-slate-500 font-medium" suppressHydrationWarning>{item.timestamp}</span>
                              <span className="text-xs sm:text-sm lg:text-base bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-semibold" suppressHydrationWarning>{item.action}</span>
                            </div>
                            <h3 className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight" suppressHydrationWarning>{item.name}</h3>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-4 sm:p-6 border-t border-white/50 bg-slate-50/50" suppressHydrationWarning>
                  <div className="flex items-center justify-between text-sm sm:text-base lg:text-lg text-slate-600" suppressHydrationWarning>
                    <span>总场景数: <span className="font-bold text-indigo-600">{sceneHistory.length}</span></span>
                    <button onClick={() => setSceneHistory([])} className="bg-transparent text-red-600 hover:text-red-700 border-2 border-red-600 hover:border-red-700 transition-all duration-300 font-bold px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-xl shadow-sm hover:shadow-md active:scale-95 text-sm sm:text-base lg:text-lg">
                      清空时间线
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 输入控制栏 */}
          <div className="sticky bottom-0 z-40 bg-white/90 backdrop-blur-xl border-t border-white/50 shadow-lg shadow-indigo-500/5 relative" suppressHydrationWarning>
            <div className="p-5 sm:p-6 lg:p-8 max-w-4xl mx-auto" suppressHydrationWarning>
              <div className="flex flex-row gap-3 sm:gap-4 items-center" suppressHydrationWarning>
                <div className="flex-grow relative" suppressHydrationWarning>
                  <input
                    id="input"
                    type="text"
                    placeholder="输入命令（如：观察、北、物品）..."
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
                    className="w-full p-4 sm:p-5 lg:p-6 pr-20 sm:pr-24 lg:pr-28 rounded-xl border-2 border-white/50 bg-white/80 backdrop-blur focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-300 font-sans text-base sm:text-lg lg:text-xl placeholder-slate-400 shadow-sm"
                    suppressHydrationWarning
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('input') as HTMLInputElement
                      if (input.value.trim()) {
                        executeCommand(input.value.trim())
                        input.value = ''
                      }
                    }}
                    className="absolute right-2 sm:right-3 lg:right-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-bold px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 active:scale-95 flex items-center justify-center"
                  >
                    <IconSend className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                  </button>
                </div>
                
                <div className="flex gap-2 sm:gap-3 lg:gap-4 w-auto" suppressHydrationWarning>
                  <button
                    onClick={exportTxt}
                    className="bg-transparent text-purple-600 hover:text-purple-700 border-2 border-purple-600 hover:border-purple-700 transition-all duration-300 font-bold px-3 sm:px-4 lg:px-5 py-3 sm:py-3.5 lg:py-4 rounded-xl shadow-sm hover:shadow-md active:scale-95 text-xs sm:text-sm lg:text-sm flex items-center justify-center gap-1.5 sm:gap-2 min-w-[80px] whitespace-nowrap"
                  >
                    <IconFile className="w-4 h-4 sm:w-5 h-5 lg:w-5 h-5" />
                    <span className="inline">导出TXT</span>
                  </button>
                  <button
                    onClick={exportProgress}
                    className="bg-transparent text-purple-600 hover:text-purple-700 border-2 border-purple-600 hover:border-purple-700 transition-all duration-300 font-bold px-3 sm:px-4 lg:px-5 py-3 sm:py-3.5 lg:py-4 rounded-xl shadow-sm hover:shadow-md active:scale-95 text-xs sm:text-sm lg:text-sm flex items-center justify-center gap-1.5 sm:gap-2 min-w-[80px] whitespace-nowrap"
                  >
                    <IconSave className="w-4 h-4 sm:w-5 h-5 lg:w-5 h-5" />
                    <span className="inline">导出进度</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
