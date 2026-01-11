'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  Save, 
  Upload, 
  Download,
  Play,
  Settings,
  Image as ImageIcon,
  Palette,
  Type,
  ArrowLeftRight,
  Eye,
  RefreshCw
} from 'lucide-react';
import { FileUpload } from '@/components/file-upload';
import { gameStore } from '@/lib/game-store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PlatformFileDownloader } from '@/lib/platform-file-download';
import { PlatformFileUploader } from '@/lib/platform-file-upload';

interface Choice {
  id: string;
  choice: string;
  next_branch: string;
  effect?: string;
  status_update?: string;
  end_game?: boolean;
}

interface Branch {
  branch_id: string;
  chapter: string;
  scene_detail: string;
  choices: Choice[];
  background_image?: string;
  background_asset_id?: string;
}

interface GameData {
  game_title: string;
  description: string;
  author: string;
  status: string;
  branches: Branch[];
}

export default function EnhancedGameEditor() {
  const router = useRouter();
  const [gameData, setGameData] = useState<GameData>({
    game_title: '',
    description: '',
    author: '',
    status: 'draft',
    branches: []
  });
  const [currentBranchIndex, setCurrentBranchIndex] = useState(0);
  const [bgImageUrl, setBgImageUrl] = useState<string>('');
  const [bgAssetId, setBgAssetId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载游戏数据
  useEffect(() => {
    const loadGameData = async () => {
      try {
        setIsLoading(true);
        
        // 检查sessionStorage中是否有游戏数据
        const sessionData = sessionStorage.getItem('gameData');
        if (sessionData) {
          const data = JSON.parse(sessionData);
          setGameData(data);
          
          // 如果有背景图片，尝试加载
          if (data.background_image) {
            setBgImageUrl(data.background_image);
          }
          
          sessionStorage.removeItem('gameData');
        } else {
          // 创建默认游戏结构
          setGameData({
            game_title: '我的新游戏',
            description: '一个精彩的文本冒险游戏',
            author: '作者',
            status: 'draft',
            branches: [{
              branch_id: 'start',
              chapter: '第一章',
              scene_detail: '故事从这里开始...',
              choices: [{
                id: '1',
                choice: '继续冒险',
                next_branch: 'branch1',
                effect: '你感到兴奋',
                status_update: '状态：准备就绪'
              }]
            }]
          });
        }
      } catch (error) {
        console.error('加载游戏数据失败:', error);
        toast.error('加载游戏数据失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadGameData();
  }, []);

  // 保存游戏数据
  const saveGame = useCallback(async () => {
    try {
      // 创建包含背景图片信息的完整游戏数据
      const gameDataWithBg = {
        ...gameData,
        background_image: bgImageUrl,
        background_asset_id: bgAssetId
      };

      // 保存到IndexedDB
      await gameStore.createGame(
        gameData.game_title,
        gameDataWithBg,
        {
          description: gameData.description,
          author: gameData.author
        }
      );

      setHasChanges(false);
      toast.success('游戏保存成功！');
    } catch (error) {
      console.error('保存游戏失败:', error);
      toast.error('保存游戏失败');
    }
  }, [gameData, bgImageUrl, bgAssetId]);

  // 处理背景图片上传
  const handleBackgroundUpload = useCallback(async (assetId: string, imageUrl: string) => {
    // 释放旧的图片URL
    if (bgImageUrl && bgImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(bgImageUrl);
    }

    setBgImageUrl(imageUrl);
    setBgAssetId(assetId);
    setHasChanges(true);
  }, [bgImageUrl]);

  // 处理背景图片移除
  const handleBackgroundRemove = useCallback(() => {
    if (bgImageUrl && bgImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(bgImageUrl);
    }
    
    setBgImageUrl('');
    setBgAssetId('');
    setHasChanges(true);
  }, [bgImageUrl]);

  // 添加新分支
  const addBranch = useCallback(() => {
    const newBranch: Branch = {
      branch_id: `branch_${Date.now()}`,
      chapter: `第${gameData.branches.length + 1}章`,
      scene_detail: '新的场景描述...',
      choices: [{
        id: `choice_${Date.now()}`,
        choice: '选择1',
        next_branch: '',
        effect: '',
        status_update: '',
        end_game: false
      }]
    };
    
    setGameData(prev => ({
      ...prev,
      branches: [...prev.branches, newBranch]
    }));
    
    setCurrentBranchIndex(gameData.branches.length);
    setHasChanges(true);
  }, [gameData.branches.length]);

  // 更新分支数据
  const updateBranch = useCallback((index: number, field: keyof Branch, value: any) => {
    setGameData(prev => {
      const newBranches = [...prev.branches];
      newBranches[index] = {
        ...newBranches[index],
        [field]: value
      };
      return {
        ...prev,
        branches: newBranches
      };
    });
    setHasChanges(true);
  }, []);

  // 更新选择项
  const updateChoice = useCallback((branchIndex: number, choiceIndex: number, field: keyof Choice, value: any) => {
    setGameData(prev => {
      const newBranches = [...prev.branches];
      const newChoices = [...newBranches[branchIndex].choices];
      newChoices[choiceIndex] = {
        ...newChoices[choiceIndex],
        [field]: value
      };
      newBranches[branchIndex] = {
        ...newBranches[branchIndex],
        choices: newChoices
      };
      return {
        ...prev,
        branches: newBranches
      };
    });
    setHasChanges(true);
  }, []);

  // 添加选择项
  const addChoice = useCallback((branchIndex: number) => {
    const newChoice: Choice = {
      id: `choice_${Date.now()}`,
      choice: '新选择',
      next_branch: '',
      effect: '',
      status_update: '',
      end_game: false
    };
    
    setGameData(prev => {
      const newBranches = [...prev.branches];
      newBranches[branchIndex] = {
        ...newBranches[branchIndex],
        choices: [...newBranches[branchIndex].choices, newChoice]
      };
      return {
        ...prev,
        branches: newBranches
      };
    });
    setHasChanges(true);
  }, []);

  // 删除选择项
  const removeChoice = useCallback((branchIndex: number, choiceIndex: number) => {
    if (gameData.branches[branchIndex].choices.length <= 1) {
      toast.warning('每个分支至少需要有一个选择项');
      return;
    }
    
    setGameData(prev => {
      const newBranches = [...prev.branches];
      const newChoices = newBranches[branchIndex].choices.filter((_, i) => i !== choiceIndex);
      newBranches[branchIndex] = {
        ...newBranches[branchIndex],
        choices: newChoices
      };
      return {
        ...prev,
        branches: newBranches
      };
    });
    setHasChanges(true);
  }, [gameData.branches]);

  // 删除分支
  const removeBranch = useCallback((index: number) => {
    if (gameData.branches.length <= 1) {
      toast.warning('游戏至少需要一个分支');
      return;
    }
    
    setGameData(prev => ({
      ...prev,
      branches: prev.branches.filter((_, i) => i !== index)
    }));
    
    if (currentBranchIndex >= gameData.branches.length - 1) {
      setCurrentBranchIndex(gameData.branches.length - 2);
    }
    
    setHasChanges(true);
  }, [gameData.branches.length, currentBranchIndex]);

  // 测试游戏
  const testGame = useCallback(() => {
    const gameDataWithBg = {
      ...gameData,
      background_image: bgImageUrl,
      background_asset_id: bgAssetId
    };
    
    sessionStorage.setItem('gameData', JSON.stringify(gameDataWithBg));
    router.push('/');
  }, [gameData, bgImageUrl, bgAssetId, router]);

  // 导出游戏
  const exportGame = useCallback(async () => {
    try {
      const gameDataWithBg = {
        ...gameData,
        background_image: bgImageUrl,
        background_asset_id: bgAssetId
      };

      await PlatformFileDownloader.downloadJson(
        `${gameData.game_title || '游戏'}.json`,
        gameDataWithBg,
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
  }, [gameData, bgImageUrl, bgAssetId]);

  // 导入游戏
  const importGame = useCallback(async () => {
    try {
      const result = await PlatformFileUploader.uploadJson({
        onProgress: (progress) => {
          console.log(`导入进度: ${progress}%`)
        }
      })

      if (result.success && result.data) {
        const data = JSON.parse(result.data as string)
        setGameData(data)

        // 设置背景图片
        if (data.background_image) {
          setBgImageUrl(data.background_image)
        }

        if (data.background_asset_id) {
          setBgAssetId(data.background_asset_id)
        }

        setCurrentBranchIndex(0)
        toast.success('游戏导入成功！')
      }
    } catch (error) {
      console.error('导入游戏失败:', error)
      toast.error('导入失败：无效的JSON文件')
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  const currentBranch = gameData.branches[currentBranchIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">游戏编辑器</h1>
              <Input
                value={gameData.game_title}
                onChange={(e) => {
                  setGameData(prev => ({ ...prev, game_title: e.target.value }));
                  setHasChanges(true);
                }}
                className="max-w-xs"
                placeholder="游戏标题"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={testGame}>
                <Play className="h-4 w-4 mr-2" />
                测试
              </Button>
              
              <Button variant="outline" size="sm" onClick={exportGame}>
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              
              <Button variant="outline" size="sm" onClick={importGame}>
                <Upload className="h-4 w-4 mr-2" />
                导入
              </Button>
              
              <Button size="sm" onClick={saveGame} disabled={!hasChanges}>
                <Save className="h-4 w-4 mr-2" />
                保存{hasChanges && ' *'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* 左侧：分支列表 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>分支管理</span>
                  <Button size="sm" variant="outline" onClick={addBranch}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {gameData.branches.map((branch, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        currentBranchIndex === index
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setCurrentBranchIndex(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {branch.chapter || `分支 ${index + 1}`}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {branch.branch_id}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBranch(index);
                          }}
                          className="ml-2"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：分支编辑 */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* 基本信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="h-5 w-5" />
                    基本信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>章节标题</Label>
                    <Input
                      value={currentBranch.chapter}
                      onChange={(e) => updateBranch(currentBranchIndex, 'chapter', e.target.value)}
                      placeholder="章节标题"
                    />
                  </div>
                  
                  <div>
                    <Label>场景描述</Label>
                    <Textarea
                      value={currentBranch.scene_detail}
                      onChange={(e) => updateBranch(currentBranchIndex, 'scene_detail', e.target.value)}
                      placeholder="场景描述"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 背景图片 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    背景图片
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    gameId="current-game"
                    currentImageUrl={bgImageUrl}
                    onImageUploaded={handleBackgroundUpload}
                    onImageRemoved={handleBackgroundRemove}
                    label="场景背景图片"
                    description="上传此场景的背景图片，支持 JPG、PNG、WebP、GIF 格式"
                  />
                </CardContent>
              </Card>

              {/* 选择项 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ArrowLeftRight className="h-5 w-5" />
                      选择项
                    </span>
                    <Button size="sm" variant="outline" onClick={() => addChoice(currentBranchIndex)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentBranch.choices.map((choice, choiceIndex) => (
                    <div key={choice.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary">选择 {choiceIndex + 1}</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeChoice(currentBranchIndex, choiceIndex)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="grid gap-3">
                        <div>
                          <Label>选择文本</Label>
                          <Input
                            value={choice.choice}
                            onChange={(e) => updateChoice(currentBranchIndex, choiceIndex, 'choice', e.target.value)}
                            placeholder="选择文本"
                          />
                        </div>
                        
                        <div>
                          <Label>下一个分支</Label>
                          <select
                            value={choice.next_branch}
                            onChange={(e) => updateChoice(currentBranchIndex, choiceIndex, 'next_branch', e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="">选择下一个分支</option>
                            {gameData.branches.map((branch, index) => (
                              <option key={branch.branch_id} value={branch.branch_id}>
                                {branch.chapter || branch.branch_id}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <Label>效果描述</Label>
                          <Input
                            value={choice.effect || ''}
                            onChange={(e) => updateChoice(currentBranchIndex, choiceIndex, 'effect', e.target.value)}
                            placeholder="选择后的效果描述"
                          />
                        </div>
                        
                        <div>
                          <Label>状态更新</Label>
                          <Input
                            value={choice.status_update || ''}
                            onChange={(e) => updateChoice(currentBranchIndex, choiceIndex, 'status_update', e.target.value)}
                            placeholder="状态变化描述"
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={choice.end_game || false}
                            onChange={(e) => updateChoice(currentBranchIndex, choiceIndex, 'end_game', e.target.checked)}
                            className="rounded"
                          />
                          <Label className="mb-0">结束游戏</Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}