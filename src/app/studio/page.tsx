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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { gameStore } from "@/lib/game-store"
import { toast } from "sonner"

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
  background_image?: string
  background_asset_id?: string
}

interface GameData {
  game_title: string
  description: string
  status?: string
  branches: Branch[]
}

const NO_JUMP_VALUE = "__NO_JUMP__"

function normalizeGameData(raw: any): GameData {
  const statusValue =
    typeof raw?.status === "string" ? raw.status : "draft"

  const branches: Branch[] = Array.isArray(raw?.branches)
    ? raw.branches.map((b: any, branchIndex: number) => {
        const choices: Choice[] = Array.isArray(b?.choices)
          ? b.choices.map((c: any, choiceIndex: number) => ({
              id:
                c?.id ||
                `choice_${branchIndex}_${choiceIndex}_${Date.now()}`,
              choice: c?.choice ?? "",
              next_branch: c?.next_branch ?? "",
              effect: c?.effect,
              status_update: c?.status_update,
              end_game: !!c?.end_game,
            }))
          : []
        return {
          branch_id: b?.branch_id ?? `branch_${branchIndex}`,
          chapter: b?.chapter ?? "",
          scene_detail: b?.scene_detail ?? "",
          choices,
          background_image: b?.background_image,
          background_asset_id: b?.background_asset_id,
        }
      })
    : []

  return {
    game_title: raw?.game_title ?? raw?.title ?? "未命名游戏",
    description: raw?.description ?? "",
    status: statusValue,
    branches,
  }
}

const initialGameData: GameData = {
  game_title: "黑暗森林",
  description: "在这片阴森的森林中，你的每一次选择都将改变命运。",
  status: "draft",
  branches: [
    {
      branch_id: "start",
      chapter: "森林入口",
      scene_detail: "你站在一片阴森的森林入口。空气中弥漫着潮湿泥土的气味，远处的树木在迷雾中若隐若现。",
      choices: [
        {
          id: "choice_1",
          choice: "走进森林",
          next_branch: "",
          effect: "",
          status_update: "",
        },
        {
          id: "choice_2",
          choice: "转身离开",
          next_branch: "",
          effect: "",
          status_update: "",
          end_game: true,
        },
      ],
    },
  ],
}

function BranchIcon(props: { branch: Branch; index: number }) {
  const { branch, index } = props
  const isStart = index === 0
  const hasChoices = branch.choices && branch.choices.length > 0
  const isEnd = !hasChoices || branch.choices.some((c) => c.end_game)

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
        if (raw.game_title && Array.isArray(raw.branches)) {
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
      const text = `${b.branch_id} ${b.chapter} ${b.scene_detail}`.toLowerCase()
      return text.includes(keyword)
    })
  }, [gameData.branches, search])

  // 使用useCallback缓存函数，减少不必要的重渲染
  const handleUpdateGame = React.useCallback((updates: Partial<GameData>) => {
    setGameData((prev) => ({
      ...prev,
      ...updates,
    }))
  }, [])

  // 使用useCallback缓存函数，减少不必要的重渲染
  const handleAddBranch = React.useCallback(() => {
    const id = `branch_${Date.now()}`
    const newBranch: Branch = {
      branch_id: id,
      chapter: "新场景",
      scene_detail: "",
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
      branches: prev.branches.map((b) =>
        b.branch_id === branchId ? { ...b, ...updates } : b,
      ),
    }))
  }, [])

  const handleAddChoice = React.useCallback((branchId: string) => {
    const newChoice: Choice = {
      id: `choice_${Date.now()}`,
      choice: "新选项",
      next_branch: "",
      end_game: false,
    }
    setGameData((prev) => ({
      ...prev,
      branches: prev.branches.map((b) =>
        b.branch_id === branchId
          ? { ...b, choices: [...b.choices, newChoice] }
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
      branches: prev.branches.map((b) =>
        b.branch_id === branchId
          ? {
              ...b,
              choices: b.choices.map((c) =>
                c.id === choiceId ? { ...c, ...updates } : c,
              ),
            }
          : b,
      ),
    }))
  }, [])

  const handleDeleteChoice = React.useCallback((branchId: string, choiceId: string) => {
    setGameData((prev) => ({
      ...prev,
      branches: prev.branches.map((b) =>
        b.branch_id === branchId
          ? { ...b, choices: b.choices.filter((c) => c.id !== choiceId) }
          : b,
      ),
    }))
  }, [])

  const handleSaveToLibrary = async () => {
    if (!gameData.game_title.trim()) {
      toast.error("请先填写游戏标题")
      return
    }
    if (gameData.branches.length === 0) {
      toast.error("请至少创建一个场景分支")
      return
    }
    try {
      await gameStore.createGame(
        gameData.game_title,
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
      await PlatformFileDownloader.downloadJson(
        `${gameData.game_title || "game"}.json`,
        gameData,
        {
          onProgress: (progress) => {
            console.log(`导出进度: ${progress}%`)
          },
          onSuccess: () => {
            toast.success("游戏导出成功！")
          },
          onError: (error) => {
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
      const result = await PlatformFileUploader.upload({
        file,
        accept: "application/json,.json",
        maxSize: 10 * 1024 * 1024,
        onProgress: (progress) => {
          console.log(`导入进度: ${progress}%`)
        },
        onSuccess: (uploadResult) => {
          if (uploadResult.success && uploadResult.data) {
            const raw = JSON.parse(uploadResult.data as string)
            if (raw.game_title && Array.isArray(raw.branches)) {
              const data = normalizeGameData(raw)
              setGameData(data)
              setSelectedBranchId(data.branches[0]?.branch_id ?? "")
              toast.success("导入成功")
            } else {
              toast.error("JSON 结构不符合游戏格式")
            }
          }
        },
        onError: (error) => {
          toast.error(`导入失败: ${error.message}`)
        }
      })
    } catch (error) {
      console.error("导入游戏失败:", error)
      toast.error("导入游戏失败")
    }
  }

  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-br from-slate-100 via-sky-100 to-indigo-100 text-slate-900 overflow-hidden">
      <header className="h-20 border-b bg-white/95 backdrop-blur-xl text-slate-900 flex items-center justify-between px-4 shrink-0 z-10 shadow-sm">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <h1
              className="text-base md:text-xl font-extrabold max-w-full text-left bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-sm leading-tight outline-none border border-transparent rounded-md px-2 py-1 hover:border-indigo-200 focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-1 focus-visible:ring-offset-white"
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
                className="field-sizing-content w-full h-12 min-h-0 resize-none px-3 py-2 text-xs md:text-sm leading-snug overflow-y-auto bg-white/80 border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-md shadow-xs"
                placeholder="简要描述这个游戏"
              />
              <div className="flex flex-col gap-1 shrink-0 w-[110px]">
                <Label className="text-[11px] text-slate-500">
                  状态
                </Label>
                <Select
                  value={gameData.status ?? "draft"}
                  onValueChange={(val) => handleUpdateGame({ status: val })}
                >
                  <SelectTrigger className="h-8 w-full px-2 text-[11px] bg-white border-slate-200 text-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-slate-900 border-slate-200 shadow-lg">
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="published">已发布</SelectItem>
                    <SelectItem value="archived">归档</SelectItem>
                  </SelectContent>
                </Select>
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
            variant="outline"
            size="sm"
            className="gap-1 bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
            onClick={() => {
              // 直接触发文件选择对话框
              const input = document.getElementById('json-import') as HTMLInputElement
              input?.click()
            }}
          >
            <Upload className="h-4 w-4" /> 导入
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
            onClick={async () => {
              await handleExportJson()
            }}
          >
            <Upload className="h-4 w-4 rotate-180" /> 导出
          </Button>
          <Button
            variant="default"
            size="sm"
            className="gap-2 bg-emerald-500 text-emerald-950 hover:bg-emerald-400 shadow-sm"
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
            <div className="p-3 border-b border-slate-200 space-y-3 bg-white/90">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                          placeholder="搜索场景..."
                          className="pl-8 h-9 bg-slate-100 border-slate-200 text-slate-800 placeholder:text-slate-400"
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
                            {branch.chapter || branch.branch_id}
                          </span>
                          <span className="text-[10px] text-slate-500 whitespace-nowrap">
                            {branch.choices.length} 选项
                          </span>
                        </div>
                        <div className="mt-0.5 ml-6 w-[calc(100%-1.5rem)] text-[10px] text-slate-400 truncate">
                          ID: {branch.branch_id}
                        </div>
                        {branch.choices.length > 0 && (
                          <div className="flex flex-col mt-1 ml-6 w-[calc(100%-1.5rem)] border-l-2 border-slate-200 pl-2 gap-1">
                            {branch.choices.map((choice) => {
                              const target = gameData.branches.find(
                                (b) => b.branch_id === choice.next_branch,
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
                                    {choice.choice}
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
                  variant="ghost"
                  className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
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
                <div className="p-4 border-b border-slate-200 flex items-start justify-between gap-4 bg-white/90 shadow-xs">
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="branch-id">场景 ID</Label>
                        <Input
                          id="branch-id"
                          value={selectedBranch.branch_id}
                          readOnly
                          className="bg-slate-50 font-mono text-xs border-slate-200 text-slate-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="branch-name">场景名称</Label>
                        <Input
                          id="branch-name"
                          value={selectedBranch.chapter}
                          placeholder="输入场景名称"
                          className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                          onChange={(e) =>
                            handleUpdateBranch(selectedBranch.branch_id, {
                              chapter: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40"
                      onClick={() => handleDeleteBranch(selectedBranch.branch_id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      删除场景
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1 min-h-0">
                  <div className="p-4 space-y-6 max-w-5xl mx-auto w-full">
                      <div className="space-y-3">
                        <Label>背景图片</Label>
                        <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-slate-500 bg-slate-100">
                          {selectedBranch.background_image ? (
                            <div className="relative w-full aspect-video bg-slate-200 rounded overflow-hidden">
                              <div className="absolute inset-0 flex items-center justify-center bg-slate-200 text-slate-500">
                                <ImageIcon className="h-10 w-10" />
                                <span className="ml-2">
                                  {selectedBranch.background_image}
                                </span>
                              </div>
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="h-8 w-8" />
                            <span className="text-sm">
                              未设置背景图片，将使用默认背景
                            </span>
                            <span className="text-xs">建议尺寸: 800x600</span>
                          </>
                        )}
                      </div>
                      <Input
                        value={selectedBranch.background_image ?? ""}
                        onChange={(e) =>
                          handleUpdateBranch(selectedBranch.branch_id, {
                            background_image: e.target.value || undefined,
                          })
                        }
                        className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                        placeholder="输入背景图片 URL 或资源说明"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>剧情描述</Label>
                      </div>
                      <div className="border border-slate-200 rounded-lg bg-white p-2">
                        <Textarea
                          className="min-h-[200px] font-sans text-base leading-relaxed text-slate-900"
                          placeholder="在此输入剧情内容..."
                          value={selectedBranch.scene_detail}
                          onChange={(e) =>
                            handleUpdateBranch(selectedBranch.branch_id, {
                              scene_detail: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4 border border-slate-200 rounded-lg bg-white p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">
                          分支选项
                        </Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleAddChoice(selectedBranch.branch_id)
                          }
                        >
                          <Plus className="h-4 w-4 mr-2" /> 添加选项
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {selectedBranch.choices.map((option, index) => (
                          <Card
                          key={option.id}
                          className="relative group bg-slate-100 border-slate-200 shadow-sm"
                        >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                              onClick={() =>
                                handleDeleteChoice(
                                  selectedBranch.branch_id,
                                  option.id,
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          <CardContent className="p-4 grid gap-4">
                            <div className="grid grid-cols-[auto_1fr] gap-4 items-center">
                              <Badge className="h-6 w-6 flex items-center justify-center p-0 rounded-full bg-emerald-500 text-emerald-950">
                                {index + 1}
                              </Badge>
                              <Input
                                value={option.choice}
                                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                                onChange={(e) =>
                                  handleUpdateChoice(
                                    selectedBranch.branch_id,
                                      option.id,
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
                                      option.next_branch === ""
                                        ? NO_JUMP_VALUE
                                        : option.next_branch
                                    }
                                    onValueChange={(val) =>
                                      handleUpdateChoice(
                                        selectedBranch.branch_id,
                                        option.id,
                                        {
                                          next_branch:
                                            val === NO_JUMP_VALUE ? "" : val,
                                        },
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-8 bg-white border-slate-200 text-slate-900">
                                      <SelectValue placeholder="选择目标场景..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white text-slate-900 border-slate-200 shadow-lg">
                                      <SelectItem value={NO_JUMP_VALUE}>
                                        不跳转（停留当前场景）
                                      </SelectItem>
                                      {gameData.branches.map((b) => (
                                        <SelectItem
                                          key={b.branch_id}
                                          value={b.branch_id}
                                        >
                                          {b.chapter || b.branch_id}
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
                                        option.id,
                                        { end_game: val === "yes" },
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-8 bg-white border-slate-200 text-slate-900">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white text-slate-900 border-slate-200 shadow-lg">
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
                                  className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                                  onChange={(e) =>
                                    handleUpdateChoice(
                                      selectedBranch.branch_id,
                                        option.id,
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
                                  className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                                  onChange={(e) =>
                                    handleUpdateChoice(
                                      selectedBranch.branch_id,
                                        option.id,
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

                        {selectedBranch.choices.length === 0 && (
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
