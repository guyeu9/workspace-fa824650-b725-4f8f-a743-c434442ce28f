'use client'

import { useState, useRef, useEffect } from 'react'
import { useMobileDevice, useTouchGesture, useVibration, useFullscreen } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { 
  Play, 
  Save, 
  Share2, 
  Settings,
  RotateCcw,
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
  Edit3,
  Eye,
  EyeOff
} from 'lucide-react'

interface MobileGameEditorProps {
  initialData?: any
  onSave: (data: any) => void
  onPlay: (data: any) => void
  onShare: (data: any) => void
}

export default function MobileGameEditor({ 
  initialData, 
  onSave, 
  onPlay, 
  onShare 
}: MobileGameEditorProps) {
  const device = useMobileDevice()
  const { lightVibration, mediumVibration } = useVibration()
  const { isFullscreen, toggleFullscreen } = useFullscreen()
  const editorRef = useRef<HTMLDivElement>(null)
  
  const [currentScene, setCurrentScene] = useState('start')
  const [isEditing, setIsEditing] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [gameData, setGameData] = useState({
    title: '我的文字冒险游戏',
    description: '一个精彩的冒险故事',
    scenes: {
      start: {
        text: '你站在一个神秘的森林入口，前方有两条路...',
        choices: [
          { text: '走左边的路', nextScene: 'leftPath' },
          { text: '走右边的路', nextScene: 'rightPath' }
        ]
      }
    },
    ...initialData
  })

  // 触摸手势支持
  useTouchGesture(editorRef, {
    swipeLeft: () => {
      if (isEditing) {
        setShowPreview(true)
        lightVibration()
      }
    },
    swipeRight: () => {
      if (showPreview) {
        setShowPreview(false)
        lightVibration()
      }
    },
    doubleTap: () => {
      toggleFullscreen(editorRef.current!)
      mediumVibration()
    }
  })

  if (!device.isMobile) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>此编辑器专为移动端优化</p>
        <p className="text-sm mt-2">请在移动设备上使用获得最佳体验</p>
      </div>
    )
  }

  const handleSceneChange = (sceneId: string) => {
    setCurrentScene(sceneId)
    lightVibration()
  }

  const handleTextChange = (text: string) => {
    setGameData(prev => ({
      ...prev,
      scenes: {
        ...prev.scenes,
        [currentScene]: {
          ...prev.scenes[currentScene],
          text
        }
      }
    }))
  }

  const handleChoiceChange = (index: number, text: string) => {
    setGameData(prev => ({
      ...prev,
      scenes: {
        ...prev.scenes,
        [currentScene]: {
          ...prev.scenes[currentScene],
          choices: prev.scenes[currentScene].choices.map((choice: any, i: number) =>
            i === index ? { ...choice, text } : choice
          )
        }
      }
    }))
  }

  const handleAddChoice = () => {
    setGameData(prev => ({
      ...prev,
      scenes: {
        ...prev.scenes,
        [currentScene]: {
          ...prev.scenes[currentScene],
          choices: [
            ...prev.scenes[currentScene].choices,
            { text: '新选项', nextScene: 'end' }
          ]
        }
      }
    }))
    lightVibration()
  }

  const handleRemoveChoice = (index: number) => {
    setGameData(prev => ({
      ...prev,
      scenes: {
        ...prev.scenes,
        [currentScene]: {
          ...prev.scenes[currentScene],
          choices: prev.scenes[currentScene].choices.filter((_: any, i: number) => i !== index)
        }
      }
    }))
    lightVibration()
  }

  const handleSave = () => {
    onSave(gameData)
    mediumVibration()
  }

  const handlePlay = () => {
    onPlay(gameData)
    mediumVibration()
  }

  const handleShare = () => {
    onShare(gameData)
    mediumVibration()
  }

  return (
    <div 
      ref={editorRef}
      className={cn(
        "min-h-screen bg-gradient-to-br from-blue-50 to-purple-50",
        "flex flex-col",
        isFullscreen && "fixed inset-0 z-50"
      )}
    >
      {/* 移动端状态栏 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold truncate">{gameData.title}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
            >
              {showPreview ? <Edit3 className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
            <button
              onClick={() => toggleFullscreen(editorRef.current!)}
              className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {/* 场景导航 */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Object.keys(gameData.scenes).map((sceneId) => (
            <button
              key={sceneId}
              onClick={() => handleSceneChange(sceneId)}
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                currentScene === sceneId
                  ? "bg-white text-blue-600"
                  : "bg-white bg-opacity-20 text-white hover:bg-opacity-30"
              )}
            >
              {sceneId}
            </button>
          ))}
        </div>
      </div>

      {/* 编辑/预览区域 */}
      <div className="flex-1 p-4">
        {showPreview ? (
          /* 预览模式 */
          <div className="h-full flex flex-col">
            <div className="bg-white rounded-xl p-6 shadow-lg flex-1">
              <div className="text-gray-800 text-lg leading-relaxed mb-6">
                {gameData.scenes[currentScene].text}
              </div>
              
              <div className="space-y-3">
                {gameData.scenes[currentScene].choices.map((choice: any, index: number) => (
                  <button
                    key={index}
                    className="w-full p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-left transition-all hover:shadow-lg active:scale-95"
                    onClick={() => lightVibration()}
                  >
                    {choice.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* 编辑模式 */
          <div className="h-full flex flex-col space-y-4">
            {/* 场景文本编辑 */}
            <div className="bg-white rounded-xl p-4 shadow-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                场景描述
              </label>
              <textarea
                value={gameData.scenes[currentScene].text}
                onChange={(e) => handleTextChange(e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="描述当前场景..."
              />
            </div>

            {/* 选项编辑 */}
            <div className="bg-white rounded-xl p-4 shadow-lg flex-1">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-700">
                  选择选项
                </label>
                <button
                  onClick={handleAddChoice}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  添加
                </button>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {gameData.scenes[currentScene].choices.map((choice: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      value={choice.text}
                      onChange={(e) => handleChoiceChange(index, e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="选项文字"
                    />
                    <button
                      onClick={() => handleRemoveChoice(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-around">
          <button
            onClick={handleSave}
            className="flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-blue-600 transition-all"
          >
            <Save className="h-6 w-6" />
            <span className="text-xs">保存</span>
          </button>
          
          <button
            onClick={handlePlay}
            className="flex flex-col items-center gap-1 p-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-all"
          >
            <Play className="h-8 w-8" />
          </button>
          
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-purple-600 transition-all"
          >
            <Share2 className="h-6 w-6" />
            <span className="text-xs">分享</span>
          </button>
        </div>
      </div>

      {/* 手势提示 */}
      <div className="absolute top-20 right-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-xs">
        <div>👆 双击全屏</div>
        <div>👈👉 滑动切换模式</div>
      </div>
    </div>
  )
}