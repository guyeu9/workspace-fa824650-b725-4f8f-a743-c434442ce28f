"use client"

import * as React from "react"
import {
  Folder,
  FileText,
  Star,
  Skull,
  Trophy,
  Settings,
  Save,
  Upload,
  Plus,
  Trash2,
  Image as ImageIcon,
  Search,
  LayoutTemplate,
  MoreVertical,
  CornerDownRight,
} from "lucide-react"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { FileUpload } from "@/components/file-upload"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { gameStore } from "@/lib/game-store"
import { PlatformFileDownloader } from "@/lib/platform-file-download"
import { normalizeGameData } from "@/lib/utils"
import { toast } from "sonner"

interface Choice {
  id?: string
  option_id: string
  choice?: string
  option_text: string
  target_branch_id: string
  next_branch?: string
  effect?: string
  status_changes?: any[]
  status_update?: string
  end_game?: boolean
}

interface Branch {
  branch_id: string
  branch_title: string
  chapter?: string
  content: string
  scene_detail?: string
  options: Choice[]
  choices: Choice[]
  background_image?: string
  background_asset_id?: string
}

interface GameStateConfig {
  state_id?: string
  name: string
  initial_value: number
  min?: number
  max?: number
  display_format?: 'integer' | 'percentage'
  is_percentage?: boolean
}

interface GameData {
  title: string
  game_title?: string
  description: string
  game_states?: GameStateConfig[]
  branches: Branch[]
}

const NO_JUMP_VALUE = "__NO_JUMP__"

const initialGameData: GameData = {
  title: "黑暗森林",
  game_title: "黑暗森林",
  description: "在这片阴森的森林中，你的每一次选择都将改变命运。",
  branches: [
    {
      branch_id: "start",
      branch_title: "森林入口",
      chapter: "森林入口",
      content: "你站在一片阴森的森林入口。空气中弥漫着潮湿泥土的气味，远处的树木在迷雾中若隐若现。",
      scene_detail: "你站在一片阴森的森林入口。空气中弥漫着潮湿泥土的气味，远处的树木在迷雾中若隐若现。",
      options: [
        {
          option_id: "choice_1",
          id: "choice_1",
          option_text: "走进森林",
          choice: "走进森林",
          target_branch_id: "",
          next_branch: "",
          effect: "",
          status_changes: [],
        },
        {
          option_id: "choice_2",
          id: "choice_2",
          option_text: "转身离开",
          choice: "转身离开",
          target_branch_id: "",
          next_branch: "",
          effect: "",
          status_changes: [],
          end_game: true,
        },
      ],
      choices: [
        {
          option_id: "choice_1",
          id: "choice_1",
          option_text: "走进森林",
          choice: "走进森林",
          target_branch_id: "",
          next_branch: "",
          effect: "",
          status_changes: [],
        },
        {
          option_id: "choice_2",
          id: "choice_2",
          option_text: "转身离开",
          choice: "转身离开",
          target_branch_id: "",
          next_branch: "",
          effect: "",
          status_changes: [],
          end_game: true,
        },
      ],
    },
  ],
}

function BranchIcon(props: { branch: Branch; index: number }) {
  const { branch, index } = props
  const isStart = index === 0
  const hasChoices = (branch.options?.length ?? 0) > 0
  const isEnd = !hasChoices || (branch.options?.some((c) => c.end_game) ?? false)

  if (isStart) {
    return <Star className="h-4 w-4 text-yellow-500" />
  }

  if (isEnd) {
    return <Skull className="h-4 w-4 text-red-500" />
  }

  return <FileText className="h-4 w-4 text-slate-500" />
}

export default function TextEngineStudio() {
  const [gameData, setGameData] = React.useState<GameData>(initialGameData)
  const [selectedBranchId, setSelectedBranchId] = React.useState<string>(
    initialGameData.branches[0]?.branch_id ?? "",
  )
  const [search, setSearch] = React.useState("")

  React.useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = window.sessionStorage.getItem("gameData")
      if (stored) {
        const raw = JSON.parse(stored)
        if ((raw.title || raw.game_title) && Array.isArray(raw.branches)) {
          const data = normalizeGameData(raw)
          setGameData(data)
          setSelectedBranchId(data.branches[0]?.branch_id ?? "")
        }
      }
    } catch (error) {
    }
  }, [])

  const selectedBranch =
    gameData.branches.find((b) => b.branch_id === selectedBranchId) ??
    gameData.branches[0] ??
    null

  const filteredBranches = React.useMemo(() => {
    if (!search.trim()) return gameData.branches
    const keyword = search.trim().toLowerCase()
    return gameData.branches.filter((b) => {
      const text = `${b.branch_id} ${b.branch_title} ${b.content}`.toLowerCase()
      return text.includes(keyword)
    })
  }, [gameData.branches, search])

  // 使用useCallback缓存函数，减少不必要的重渲染
  const handleUpdateGame = React.useCallback((updates: Partial<GameData>) => {
    setGameData((prev) => {
      const newData = { ...prev, ...updates };
      if (updates.title) newData.game_title = updates.title;
      if (updates.game_title) newData.title = updates.game_title;
      return newData;
    })
  }, [])

  // 使用useCallback缓存函数，减少不必要的重渲染
  const handleAddBranch = React.useCallback(() => {
    const id = `branch_${Date.now()}`
    const newBranch: Branch = {
      branch_id: id,
      branch_title: "新场景",
      chapter: "新场景",
      content: "",
      scene_detail: "",
      options: [],
      choices: [],
    }
    setGameData((prev) => ({
      ...prev,
      branches: [...prev.branches, newBranch],
    }))
    setSelectedBranchId(id)
  }, [])

  const handleDeleteBranch = React.useCallback((branchId: string) => {
    setGameData((prev) => {
      const branches = prev.branches.filter((b) => b.branch_id !== branchId)
      const nextSelected =
        selectedBranchId === branchId
          ? branches[0]?.branch_id ?? ""
          : selectedBranchId
      setSelectedBranchId(nextSelected)
      return {
        ...prev,
        branches,
      }
    })
  }, [selectedBranchId])

  const handleUpdateBranch = React.useCallback((branchId: string, updates: Partial<Branch>) => {
    setGameData((prev) => ({
      ...prev,
      branches: prev.branches.map((b) => {
        if (b.branch_id === branchId) {
          const newBranch = { ...b, ...updates };
          // 同步冗余字段
          if (updates.branch_title) newBranch.chapter = updates.branch_title;
          if (updates.chapter) newBranch.branch_title = updates.chapter;
          if (updates.content) newBranch.scene_detail = updates.content;
          if (updates.scene_detail) newBranch.content = updates.scene_detail;
          return newBranch;
        }
        return b;
      }),
    }))
  }, [])

  const handleAddChoice = React.useCallback((branchId: string) => {
    const id = `choice_${Date.now()}`
    const newChoice: Choice = {
      id: id,
      option_id: id,
      choice: "新选项",
      option_text: "新选项",
      next_branch: "",
      target_branch_id: "",
      end_game: false,
    }
    setGameData((prev) => ({
      ...prev,
      branches: prev.branches.map((b) =>
        b.branch_id === branchId
          ? { 
              ...b, 
              options: [...(b.options || []), newChoice],
              choices: [...(b.choices || []), newChoice]
            }
          : b,
      ),
    }))
  }, [])

  const handleUpdateChoice = React.useCallback((
    branchId: string,
    choiceId: string,
    updates: Partial<Choice>,
  ) => {
    setGameData((prev) => ({
      ...prev,
      branches: prev.branches.map((b) => {
        if (b.branch_id === branchId) {
          const newChoices = (b.options || []).map((c) => {
            if (c.id === choiceId || c.option_id === choiceId) {
              const newC = { ...c, ...updates };
              // 同步冗余字段
              if (updates.choice) newC.option_text = updates.choice;
              if (updates.option_text) newC.choice = updates.option_text;
              if (updates.next_branch !== undefined) newC.target_branch_id = updates.next_branch;
              if (updates.target_branch_id !== undefined) newC.next_branch = updates.target_branch_id;
              return newC;
            }
            return c;
          });
          return {
            ...b,
            options: newChoices,
            choices: newChoices,
          };
        }
        return b;
      }),
    }))
  }, [])

  const handleDeleteChoice = React.useCallback((branchId: string, choiceId: string) => {
    setGameData((prev) => ({
      ...prev,
      branches: prev.branches.map((b) => {
        if (b.branch_id === branchId) {
          const newChoices = (b.options || []).filter((c) => c.id !== choiceId && c.option_id !== choiceId);
          return {
            ...b,
            options: newChoices,
            choices: newChoices,
          };
        }
        return b;
      }),
    }))
  }, [])

  const handleSaveToLibrary = async () => {
    const title = gameData.title || gameData.game_title;
    if (!title || !title.trim()) {
      toast.error("请先填写游戏标题")
      return
    }
    if (gameData.branches.length === 0) {
      toast.error("请至少创建一个场景分支")
      return
    }
    try {
      await gameStore.createGame(
        title,
        gameData,
        {
          description: gameData.description,
          author: "Unknown",
        },
      )
      toast.success("已保存到游戏库")
    } catch (error) {
      toast.error("保存失败，请稍后重试")
    }
  }

  const handleExportJson = async () => {
    try {
      const title = gameData.title || gameData.game_title || "game";
      await PlatformFileDownloader.downloadJson(
        `${title}.json`,
        gameData,
        {
          onProgress: (progress: number) => {
            console.log(`导出进度: ${progress}%`)
          },
          onSuccess: () => {
            toast.success("游戏导出成功！")
          },
          onError: (error: Error) => {
            toast.error(`导出失败: ${error.message}`)
          }
        }
      )
    } catch (error) {
      console.error("导出游戏失败:", error)
      toast.error("导出游戏失败")
    }
  }

  const handleImportJson = async (file: File) => {
    try {
      const text = await file.text()
      const raw = JSON.parse(text)
      
      if ((raw.title || raw.game_title) && Array.isArray(raw.branches)) {
        const data = normalizeGameData(raw)
        setGameData(data)
        setSelectedBranchId(data.branches[0]?.branch_id ?? "")
        toast.success("导入成功")
      } else {
        toast.error("JSON 结构不符合游戏格式")
      }
    } catch (error) {
      console.error("导入游戏失败:", error)
      toast.error("导入游戏失败")
    }
  }

  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-br from-slate-100 via-sky-100 to-indigo-100 text-slate-900 overflow-hidden">
      <header className="h-auto min-h-24 border-b bg-white/95 backdrop-blur-xl text-slate-900 flex items-start justify-between px-4 py-3 shrink-0 z-10 shadow-sm flex-wrap gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <h1
              className="text-base md:text-xl font-extrabold max-w-full text-left bg-white border-2 border-blue-300 focus:border-2 focus:border-blue-500 focus:ring-blue-500/20 text-slate-800 placeholder:text-slate-400 transition-all duration-200 rounded-md px-3 py-2 leading-tight outline-none"
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) =>
                handleUpdateGame({
                  game_title: e.currentTarget.textContent ?? "",
                })
              }
            >
              {gameData.game_title || "未命名游戏"}
            </h1>
            <div className="flex items-start gap-3">
              <Textarea
                value={gameData.description}
                onChange={(e) =>
                  handleUpdateGame({ description: e.target.value })
                }
                className="field-sizing-content w-full h-12 min-h-0 resize-none px-3 py-2 text-xs md:text-sm leading-snug overflow-y-auto bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 text-slate-800 placeholder:text-slate-400 rounded-md shadow-xs transition-all duration-200"
                placeholder="简要描述这个游戏"
              />
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-slate-700">游戏状态配置</Label>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white transition-all duration-300 shadow-sm"
                  onClick={() => {
                    const newStates = [...(gameData.game_states || [])]
                    newStates.push({
                      name: `状态_${newStates.length + 1}`,
                      initial_value: 0,
                      is_percentage: false
                    })
                    handleUpdateGame({ game_states: newStates })
                  }}
                >
                  <Plus className="h-3 w-3" />
                  添加状态
                </Button>
              </div>
              
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {(gameData.game_states || []).map((state, index) => (
                  <div key={index} className="flex items-center gap-2 bg-white/50 border border-blue-200 rounded-lg p-2 transition-all duration-200 hover:border-blue-300">
                    <Input
                      value={state.name}
                      onChange={(e) => {
                        const newStates = [...(gameData.game_states || [])]
                        newStates[index] = { ...state, name: e.target.value }
                        handleUpdateGame({ game_states: newStates })
                      }}
                      className="flex-1 h-8 px-2 text-sm bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 text-slate-800 placeholder:text-slate-400 transition-all duration-200"
                      placeholder="状态名称"
                    />
                    <Input
                      type="number"
                      value={state.initial_value}
                      onChange={(e) => {
                        const newStates = [...(gameData.game_states || [])]
                        newStates[index] = { ...state, initial_value: parseFloat(e.target.value) || 0 }
                        handleUpdateGame({ game_states: newStates })
                      }}
                      className="w-20 h-8 px-2 text-sm bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 text-slate-800 placeholder:text-slate-400 transition-all duration-200"
                      placeholder="初始值"
                    />
                    <Input
                      type="number"
                      value={state.min ?? ''}
                      onChange={(e) => {
                        const newStates = [...(gameData.game_states || [])]
                        newStates[index] = { ...state, min: e.target.value ? parseFloat(e.target.value) : undefined }
                        handleUpdateGame({ game_states: newStates })
                      }}
                      className="w-16 h-8 px-2 text-sm bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 text-slate-800 placeholder:text-slate-400 transition-all duration-200"
                      placeholder="最小"
                    />
                    <Input
                      type="number"
                      value={state.max ?? ''}
                      onChange={(e) => {
                        const newStates = [...(gameData.game_states || [])]
                        newStates[index] = { ...state, max: e.target.value ? parseFloat(e.target.value) : undefined }
                        handleUpdateGame({ game_states: newStates })
                      }}
                      className="w-16 h-8 px-2 text-sm bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 text-slate-800 placeholder:text-slate-400 transition-all duration-200"
                      placeholder="最大"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const newStates = [...(gameData.game_states || [])]
                        newStates[index] = { ...state, is_percentage: !state.is_percentage }
                        handleUpdateGame({ game_states: newStates })
                      }}
                      className={state.is_percentage 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white transition-all duration-300' 
                        : 'bg-white border-blue-300 text-blue-600 hover:bg-blue-50 transition-all duration-300'}
                    >
                      %
                    </Button>
                    <Button
                      size="sm"
                      className="bg-white border-red-300 text-red-500 hover:bg-red-50 transition-all duration-300"
                      onClick={() => {
                        const newStates = [...(gameData.game_states || [])]
                        newStates.splice(index, 1)
                        handleUpdateGame({ game_states: newStates })
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <input
            ref={(ref) => {
              if (ref) {
                // 保存ref到组件实例，以便在点击按钮时调用
                ;(ref as any).parentElement?.previousElementSibling?.setAttribute('data-input-ref', ref.id)
              }
            }}
            id="json-import"
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (file) {
                await handleImportJson(file)
                e.target.value = ""
              }
            }}
          />
          <Button
            size="sm"
            className="gap-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white transition-all duration-300 shadow-sm"
            onClick={() => {
              // 直接触发文件选择对话框
              const input = document.getElementById('json-import') as HTMLInputElement
              input?.click()
            }}
          >
            <Upload className="h-4 w-4" /> 导入
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all duration-300 shadow-sm"
            onClick={async () => {
              await handleExportJson()
            }}
          >
            <Upload className="h-4 w-4 rotate-180" /> 导出
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white transition-all duration-300 shadow-md"
            onClick={handleSaveToLibrary}
          >
            <Save className="h-4 w-4" /> 保存到游戏库
          </Button>
        </div>
      </header>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel
          defaultSize={25}
          minSize={18}
          maxSize={35}
          className="bg-white/90 border-r border-slate-200 backdrop-blur-sm"
        >
          <div className="flex flex-col h-full">
            <div className="p-3 border-b border-blue-200 space-y-3 bg-white/90">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
                <Input
                          placeholder="搜索场景..."
                          className="pl-8 h-9 bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 text-slate-800 placeholder:text-slate-400 transition-all duration-200"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
              </div>
              
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>视图: 列表</span>
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-2 space-y-1">
                <div className="mb-3">
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Folder className="h-4 w-4 text-emerald-500" />
                    故事分支
                  </div>
                  <div className="pl-4 space-y-0.5">
                    {filteredBranches.map((branch, index) => (
                      <button
                        key={branch.branch_id}
                        onClick={() => setSelectedBranchId(branch.branch_id)}
                        className={`w-full flex flex-col items-start px-2 py-1.5 rounded-md text-sm transition-colors border ${
                          selectedBranchId === branch.branch_id
                            ? "bg-emerald-100 text-emerald-900 border-emerald-300 shadow-sm"
                            : "bg-white/0 text-slate-800 border-transparent hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <BranchIcon branch={branch} index={index} />
                          <span className="font-semibold flex-1 text-left text-slate-900 line-clamp-2">
                            {branch.branch_title || branch.branch_id}
                          </span>
                          <span className="text-[10px] text-slate-500 whitespace-nowrap">
                            {(branch.options?.length ?? 0)} 选项
                          </span>
                        </div>
                        <div className="mt-0.5 ml-6 w-[calc(100%-1.5rem)] text-[10px] text-slate-400 truncate">
                          ID: {branch.branch_id}
                        </div>
                        {(branch.choices?.length ?? 0) > 0 && (
                          <div className="flex flex-col mt-1 ml-6 w-[calc(100%-1.5rem)] border-l-2 border-slate-200 pl-2 gap-1">
                            {branch.choices?.map((choice) => {
                              const target = gameData.branches.find(
                                (b) => b.branch_id === choice.target_branch_id,
                              )
                              return (
                                <div
                                  key={choice.id}
                                  className="flex items-center gap-1 text-xs text-slate-500 truncate cursor-pointer hover:text-indigo-600"
                                  onClick={() =>
                                    setSelectedBranchId(
                                      target?.branch_id ?? branch.branch_id,
                                    )
                                  }
                                >
                                  <CornerDownRight className="h-3 w-3 shrink-0" />
                                  <span className="truncate">
                                    {choice.option_text}
                                    {target
                                      ? ` → ${target.chapter || target.branch_id}`
                                      : ""}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full justify-start gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white transition-all duration-300 shadow-sm"
                  onClick={handleAddBranch}
                >
                  <Plus className="h-4 w-4" /> 新建场景
                </Button>
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-border/80" />

        <ResizablePanel defaultSize={75} minSize={50}>
          <div className="h-full flex flex-col bg-slate-100">
            {selectedBranch ? (
              <>
                <div className="p-4 border-b border-blue-200 flex items-start justify-between gap-4 bg-white/90 shadow-xs">
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-[1fr_3fr] gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="branch-id">场景 ID</Label>
                        <Input
                          id="branch-id"
                          value={selectedBranch.branch_id}
                          readOnly
                          className="bg-slate-50 font-mono text-xs border-blue-300 text-slate-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="branch-name">场景名称</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="branch-name"
                            value={selectedBranch.branch_title}
                            placeholder="输入场景名称"
                            className="flex-1 bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 text-slate-900 placeholder:text-slate-400 transition-all duration-200"
                            onChange={(e) =>
                              handleUpdateBranch(selectedBranch.branch_id, {
                                chapter: e.target.value,
                              })
                            }
                          />
                          <Button
                            size="sm"
                            className="text-xs bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white transition-all duration-300 shadow-sm"
                            onClick={() => handleDeleteBranch(selectedBranch.branch_id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            删除场景
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <ScrollArea className="flex-1 min-h-0">
                  <div className="p-4 space-y-6 max-w-5xl mx-auto w-full">
                    <div className="space-y-3">
                      <FileUpload
                        gameId={gameData.game_title || "temp_game"}
                        currentImageUrl={selectedBranch.background_image}
                        onImageUploaded={(assetId, imageUrl) =>
                          handleUpdateBranch(selectedBranch.branch_id, {
                            background_image: imageUrl,
                            background_asset_id: assetId,
                          })
                        }
                        onImageRemoved={() =>
                          handleUpdateBranch(selectedBranch.branch_id, {
                            background_image: undefined,
                            background_asset_id: undefined,
                          })
                        }
                        onUrlChange={(url) =>
                          handleUpdateBranch(selectedBranch.branch_id, {
                            background_image: url || undefined,
                          })
                        }
                        showUrlInput={true}
                        label="背景图片"
                        description="上传游戏背景图片，支持 JPG、PNG、WebP、GIF 格式"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>剧情描述</Label>
                      </div>
                      <div className="border border-blue-200 rounded-lg bg-white p-2 transition-all duration-200 hover:border-blue-300">
                        <Textarea
                          className="min-h-[200px] font-sans text-base leading-relaxed text-slate-900 bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 placeholder:text-slate-400 transition-all duration-200"
                          placeholder="在此输入剧情内容..."
                          value={selectedBranch.content}
                          onChange={(e) =>
                            handleUpdateBranch(selectedBranch.branch_id, {
                              scene_detail: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4 border border-blue-200 rounded-lg bg-white p-3 shadow-sm transition-all duration-200 hover:border-blue-300">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">
                          分支选项
                        </Label>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white transition-all duration-300 shadow-sm"
                          onClick={() =>
                            handleAddChoice(selectedBranch.branch_id)
                          }
                        >
                          <Plus className="h-4 w-4 mr-2" /> 添加选项
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {selectedBranch.options.map((option, index) => (
                          <Card
                          key={option.id || option.option_id}
                          className="relative group bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-blue-200 shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-300"
                        >
                            <Button
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6 bg-gradient-to-r from-red-400 to-rose-400 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:from-red-500 hover:to-rose-500"
                              onClick={() =>
                                handleDeleteChoice(
                                  selectedBranch.branch_id,
                                  option.id || option.option_id || "",
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          <CardContent className="p-4 grid gap-4">
                            <div className="grid grid-cols-[auto_1fr] gap-4 items-center">
                              <Badge className="h-6 w-6 flex items-center justify-center p-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-emerald-950 shadow-sm">
                                {index + 1}
                              </Badge>
                              <Input
                                value={option.choice || option.option_text || ""}
                                className="bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 text-slate-900 placeholder:text-slate-400 transition-all duration-200"
                                onChange={(e) =>
                                  handleUpdateChoice(
                                    selectedBranch.branch_id,
                                      option.id || option.option_id || "",
                                      { choice: e.target.value },
                                    )
                                  }
                                  placeholder="选项文本 (例如: 走进森林)"
                                />
                              </div>

                            <div className="grid grid-cols-[1fr_1fr] gap-4 pl-10">
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">
                                  跳转至
                                </Label>
                                <Select
                                    value={
                                      (option.next_branch || option.target_branch_id) === ""
                                        ? NO_JUMP_VALUE
                                        : (option.next_branch || option.target_branch_id)
                                    }
                                    onValueChange={(val) =>
                                      handleUpdateChoice(
                                        selectedBranch.branch_id,
                                        option.id || option.option_id || "",
                                        {
                                          next_branch:
                                            val === NO_JUMP_VALUE ? "" : val,
                                        },
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-8 bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 text-slate-900 transition-all duration-200">
                                      <SelectValue placeholder="选择目标场景..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white text-slate-900 border-blue-300 shadow-lg">
                                      <SelectItem value={NO_JUMP_VALUE}>
                                        不跳转（停留当前场景）
                                      </SelectItem>
                                      {gameData.branches.map((b) => (
                                        <SelectItem
                                          key={b.branch_id}
                                          value={b.branch_id}
                                        >
                                          {b.branch_title || b.branch_id}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">
                                  是否为结局
                                </Label>
                                  <Select
                                    value={option.end_game ? "yes" : "no"}
                                    onValueChange={(val) =>
                                      handleUpdateChoice(
                                        selectedBranch.branch_id,
                                        option.id || option.option_id || "",
                                        { end_game: val === "yes" },
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-8 bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 text-slate-900 transition-all duration-200">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white text-slate-900 border-blue-300 shadow-lg">
                                      <SelectItem value="no">
                                        否（可继续游戏）
                                      </SelectItem>
                                      <SelectItem value="yes">
                                        是（游戏在此结束）
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-10">
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">
                                  状态变化说明
                                </Label>
                                <Input
                                  value={option.status_update ?? ""}
                                  className="bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 text-slate-900 placeholder:text-slate-400 transition-all duration-200"
                                  onChange={(e) =>
                                    handleUpdateChoice(
                                      selectedBranch.branch_id,
                                        option.id || option.option_id || "",
                                        { status_update: e.target.value },
                                      )
                                    }
                                    placeholder="例如：获得钥匙 / 生命-1"
                                  />
                                </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">
                                  效果描述 / 备注
                                </Label>
                                <Input
                                  value={option.effect ?? ""}
                                  className="bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 text-slate-900 placeholder:text-slate-400 transition-all duration-200"
                                  onChange={(e) =>
                                    handleUpdateChoice(
                                      selectedBranch.branch_id,
                                        option.id || option.option_id || "",
                                        { effect: e.target.value },
                                      )
                                    }
                                    placeholder="例如：标记已拜访森林小屋"
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        {(selectedBranch.options?.length ?? 0) === 0 && (
                          <div className="text-center py-8 border-2 border-dashed rounded-lg text-slate-500 text-sm bg-slate-100">
                            此场景目前没有可选项，通常代表结局场景。
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
                请在左侧创建或选择一个场景进行编辑
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
