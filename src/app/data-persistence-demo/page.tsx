'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Upload, 
  Download, 
  Trash2, 
  Play, 
  Settings,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Save,
  FileText
} from 'lucide-react';
import { gameStore } from '@/lib/game-store';
import { enhancedGameStore } from '@/lib/game-importer';
import { GameList } from '@/components/game-list';
import { FileUpload } from '@/components/file-upload';
import { toast } from 'sonner';

// 示例游戏数据
const sampleGameData = {
  game_title: "神秘森林探险",
  description: "一个充满神秘和冒险的森林探索游戏",
  author: "探险家",
  status: "published",
  branches: [
    {
      branch_id: "start",
      chapter: "森林入口",
      scene_detail: "你站在一片神秘的森林前，古老的树木高耸入云，阳光透过树叶洒下斑驳的光影。远处传来鸟儿的鸣叫声。",
      choices: [
        {
          id: "1",
          choice: "进入森林深处",
          next_branch: "deep_forest",
          effect: "你感到一丝紧张，但好奇心驱使你前进",
          status_update: "状态：探索中"
        },
        {
          id: "2", 
          choice: "沿着小径行走",
          next_branch: "path",
          effect: "你选择了看起来更安全的道路",
          status_update: "状态：谨慎前进"
        }
      ]
    },
    {
      branch_id: "deep_forest",
      chapter: "森林深处",
      scene_detail: "森林深处更加幽暗，你听到了奇怪的声音。前方有一个发光的物体。",
      choices: [
        {
          id: "3",
          choice: "调查发光物体",
          next_branch: "treasure",
          effect: "你发现了神秘的宝藏！",
          status_update: "状态：发现宝藏"
        },
        {
          id: "4",
          choice: "返回森林入口",
          next_branch: "start",
          effect: "你决定回到更安全的地方",
          status_update: "状态：返回起点"
        }
      ]
    },
    {
      branch_id: "path",
      chapter: "林间小径",
      scene_detail: "小径通向森林的另一边，你看到了一座古老的石桥。",
      choices: [
        {
          id: "5",
          choice: "过桥",
          next_branch: "bridge",
          effect: "你勇敢地走过了石桥",
          status_update: "状态：过桥"
        },
        {
          id: "6",
          choice: "原路返回",
          next_branch: "start",
          effect: "你选择了返回",
          status_update: "状态：返回"
        }
      ]
    },
    {
      branch_id: "treasure",
      chapter: "神秘宝藏",
      scene_detail: "你发现了传说中的宝藏！金光闪闪的宝箱中装满了珍贵的宝石。",
      choices: [
        {
          id: "7",
          choice: "打开宝箱",
          next_branch: "end",
          effect: "你获得了传说中的宝藏！游戏胜利！",
          status_update: "状态：游戏胜利",
          end_game: true
        }
      ]
    },
    {
      branch_id: "bridge",
      chapter: "石桥另一端",
      scene_detail: "桥的另一端是一片开阔的草地，远处可以看到村庄的炊烟。",
      choices: [
        {
          id: "8",
          choice: "前往村庄",
          next_branch: "village",
          effect: "你决定探索村庄",
          status_update: "状态：前往村庄"
        }
      ]
    },
    {
      branch_id: "village",
      chapter: "宁静村庄",
      scene_detail: "村庄里的人们热情好客，你在这里受到了热烈欢迎。冒险圆满结束！",
      choices: [
        {
          id: "9",
          choice: "结束冒险",
          next_branch: "end",
          effect: "你在村庄中定居下来，过上了幸福的生活",
          status_update: "状态：冒险结束",
          end_game: true
        }
      ]
    }
  ]
};

export default function DataPersistenceDemo() {
  const [dbStatus, setDbStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [gameCount, setGameCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  // 初始化数据库
  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      setDbStatus('checking');
      
      // 测试数据库连接
      await gameStore.listGames();
      
      // 获取游戏数量
      const games = await gameStore.listGames();
      setGameCount(games.length);
      
      setDbStatus('ready');
      addTestResult('✅ 数据库初始化成功');
    } catch (error) {
      console.error('数据库初始化失败:', error);
      setDbStatus('error');
      addTestResult('❌ 数据库初始化失败');
    }
  };

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  // 创建示例游戏
  const createSampleGame = async () => {
    setIsLoading(true);
    try {
      const result = await gameStore.createGame(
        sampleGameData.game_title,
        sampleGameData,
        {
          description: sampleGameData.description,
          author: sampleGameData.author,
          tags: ['冒险', '森林', '神秘'],
          priority: Math.floor(Math.random() * 10) + 1
        }
      );
      
      addTestResult(`✅ 创建示例游戏成功: ${result.title}`);
      
      // 更新游戏数量
      const games = await gameStore.listGames();
      setGameCount(games.length);
      
      toast.success('示例游戏创建成功！');
    } catch (error) {
      console.error('创建示例游戏失败:', error);
      addTestResult('❌ 创建示例游戏失败');
      toast.error('创建示例游戏失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 测试导入功能
  const testImport = async () => {
    setIsLoading(true);
    try {
      // 创建JSON文件
      const jsonStr = JSON.stringify(sampleGameData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const file = new File([blob], 'sample-game.json', { type: 'application/json' });
      
      const result = await enhancedGameStore.importGamePack(file);
      
      if (result.success) {
        addTestResult(`✅ 导入测试成功: ${result.count} 个游戏`);
        if (result.warnings.length > 0) {
          result.warnings.forEach(warning => addTestResult(`⚠️ ${warning}`));
        }
        toast.success(`成功导入 ${result.count} 个游戏`);
      } else {
        addTestResult('❌ 导入测试失败');
        result.errors.forEach(error => addTestResult(`❌ ${error}`));
        toast.error('导入失败');
      }
      
      // 更新游戏数量
      const games = await gameStore.listGames();
      setGameCount(games.length);
    } catch (error) {
      console.error('导入测试失败:', error);
      addTestResult('❌ 导入测试失败');
      toast.error('导入测试失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 测试数据验证
  const testValidation = async () => {
    setIsLoading(true);
    try {
      const validation = enhancedGameStore.validateGameData(sampleGameData);
      
      if (validation.valid) {
        addTestResult('✅ 数据验证通过');
        if (validation.warnings.length > 0) {
          validation.warnings.forEach(warning => addTestResult(`⚠️ ${warning}`));
        }
      } else {
        addTestResult('❌ 数据验证失败');
        validation.errors.forEach(error => addTestResult(`❌ ${error}`));
      }
    } catch (error) {
      console.error('验证测试失败:', error);
      addTestResult('❌ 验证测试失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 测试优先级排序
  const testPrioritySorting = async () => {
    setIsLoading(true);
    try {
      // 创建几个不同优先级的游戏
      const priorities = [5, 1, 10, 3, 8];
      
      for (let i = 0; i < priorities.length; i++) {
        const gameData = {
          ...sampleGameData,
          game_title: `测试游戏 ${i + 1}`
        };
        
        await gameStore.createGame(
          gameData.game_title,
          gameData,
          {
            description: `优先级测试游戏 ${i + 1}`,
            priority: priorities[i]
          }
        );
      }
      
      // 获取排序后的游戏列表
      const games = await gameStore.listGames();
      const sortedGames = games.slice(-5); // 获取最后5个游戏
      
      addTestResult('✅ 优先级排序测试完成');
      addTestResult(`📊 游戏数量: ${games.length}`);
      addTestResult(`🔢 优先级分布: ${sortedGames.map(g => g.priority).join(', ')}`);
      
      setGameCount(games.length);
      toast.success('优先级排序测试完成');
    } catch (error) {
      console.error('优先级排序测试失败:', error);
      addTestResult('❌ 优先级排序测试失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 清空数据库
  const clearDatabase = async () => {
    if (confirm('确定要清空所有游戏数据吗？此操作无法撤销。')) {
      setIsLoading(true);
      try {
        const games = await gameStore.listGames();
        await gameStore.deleteGames(games.map(g => g.id));
        
        setGameCount(0);
        addTestResult('🗑️ 数据库已清空');
        toast.success('数据库已清空');
      } catch (error) {
        console.error('清空数据库失败:', error);
        addTestResult('❌ 清空数据库失败');
        toast.error('清空数据库失败');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 测试文件上传
  const handleFileUpload = async (assetId: string, imageUrl: string) => {
    addTestResult(`✅ 文件上传成功: ${assetId}`);
    toast.success('文件上传成功！');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            数据持久化系统演示
          </h1>
          <p className="text-xl text-gray-600">
            测试文本游戏引擎的数据存储和管理功能
          </p>
        </div>

        {/* 状态面板 */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                数据库状态
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  dbStatus === 'ready' ? 'bg-green-500' :
                  dbStatus === 'checking' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium">
                  {dbStatus === 'ready' ? '就绪' :
                   dbStatus === 'checking' ? '检查中' :
                   '错误'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                游戏数量
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {gameCount}
              </div>
              <p className="text-sm text-gray-500">个游戏</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                测试状态
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                {testResults.length} 条测试结果
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 功能测试 */}
        <div className="grid gap-8 lg:grid-cols-2 mb-8">
          {/* 左侧：控制面板 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                功能测试
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <Button 
                  onClick={createSampleGame} 
                  disabled={isLoading || dbStatus !== 'ready'}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  创建示例游戏
                </Button>
                
                <Button 
                  onClick={testImport} 
                  disabled={isLoading || dbStatus !== 'ready'}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  测试导入功能
                </Button>
                
                <Button 
                  onClick={testValidation} 
                  disabled={isLoading || dbStatus !== 'ready'}
                  variant="outline"
                  className="w-full"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  测试数据验证
                </Button>
                
                <Button 
                  onClick={testPrioritySorting} 
                  disabled={isLoading || dbStatus !== 'ready'}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  测试优先级排序
                </Button>
                
                <Button 
                  onClick={clearDatabase} 
                  disabled={isLoading || dbStatus !== 'ready'}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  清空数据库
                </Button>
              </div>

              {isLoading && (
                <div className="space-y-2">
                  <Progress value={66} className="h-2" />
                  <p className="text-sm text-gray-500 text-center">测试中...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 右侧：文件上传测试 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                文件上传测试
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                gameId="test-game"
                onImageUploaded={handleFileUpload}
                label="测试图片上传"
                description="上传图片文件进行测试，支持 JPG、PNG、WebP、GIF 格式"
              />
            </CardContent>
          </Card>
        </div>

        {/* 游戏列表展示 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              游戏库展示
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GameList
              showControls={true}
              onGamePlay={(game) => {
                toast.info(`开始游戏: ${game.title}`);
              }}
              onGameEdit={(game) => {
                toast.info(`编辑游戏: ${game.title}`);
              }}
            />
          </CardContent>
        </Card>

        {/* 测试结果 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              测试结果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {testResults.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  暂无测试结果，请运行测试功能
                </p>
              ) : (
                testResults.map((result, index) => (
                  <div
                    key={index}
                    className="text-sm p-2 bg-gray-50 rounded border-l-4 border-blue-500"
                  >
                    {result}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}