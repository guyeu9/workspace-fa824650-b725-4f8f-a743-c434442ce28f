'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Upload, 
  Library,
  Play,
  Edit,
  Star,
  Clock,
  User,
  Settings
} from 'lucide-react';
import { gameStore, GameIndexItem, ImportResult } from '@/lib/game-store';
import { enhancedGameStore } from '@/lib/game-importer';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function EnhancedHomePage() {
  const router = useRouter();
  const [games, setGames] = useState<GameIndexItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  // 加载游戏列表 - 优化版本，仅加载前3个
  const loadGames = useCallback(async () => {
    try {
      setIsLoading(true);
      const gameList = await gameStore.listGames();
      
      // 双重排序：优先级降序 + 更新时间降序
      const sortedGames = [...gameList].sort((a, b) => {
        const priorityDiff = b.priority - a.priority;
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }).slice(0, 3); // 仅保留前3个
      
      setGames(sortedGames);
    } catch (error) {
      console.error('加载游戏列表失败:', error);
      toast.error('加载游戏列表失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  // 处理游戏播放
  const handleGamePlay = useCallback((game: GameIndexItem) => {
    // 获取完整游戏数据
    gameStore.getGame(game.id).then(result => {
      if (result) {
        sessionStorage.setItem('gameData', JSON.stringify(result.data.data));
        router.push('/');
      } else {
        toast.error('无法加载游戏数据');
      }
    }).catch(error => {
      console.error('加载游戏数据失败:', error);
      toast.error('加载游戏数据失败');
    });
  }, [router]);

  // 处理游戏编辑
  const handleGameEdit = useCallback((game: GameIndexItem) => {
    gameStore.getGame(game.id).then(result => {
      if (result) {
        sessionStorage.setItem('gameData', JSON.stringify(result.data.data));
        router.push('/game-editor');
      } else {
        toast.error('无法加载游戏数据');
      }
    }).catch(error => {
      console.error('加载游戏数据失败:', error);
      toast.error('加载游戏数据失败');
    });
  }, [router]);

  // 处理文件导入
  const handleFileImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const result: ImportResult = await enhancedGameStore.importGamePack(file);
      
      if (result.success) {
        toast.success(`成功导入 ${result.count} 个游戏`);
        if (result.warnings.length > 0) {
          result.warnings.forEach(warning => toast.warning(warning));
        }
        // 重新加载游戏列表
        await loadGames();
      } else {
        toast.error('导入失败');
        if (result.errors.length > 0) {
          result.errors.forEach(error => toast.error(error));
        }
      }
    } catch (error) {
      toast.error(`导入错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsImporting(false);
      // 清空文件输入
      event.target.value = '';
    }
  }, [loadGames]);

  // 格式化时间
  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: zhCN 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      {/* 头部导航 */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                文本引擎
              </h1>
              <Badge variant="secondary" className="text-xs">
                游戏库
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/library')}
              >
                <Library className="h-4 w-4 mr-2" />
                游戏库
              </Button>
              
              <Label htmlFor="import-file" className="cursor-pointer">
                <Button variant="outline" size="sm" asChild disabled={isImporting}>
                  <div>
                    <Upload className="h-4 w-4 mr-2" />
                    {isImporting ? '导入中...' : '导入'}
                  </div>
                </Button>
                <input
                  id="import-file"
                  type="file"
                  accept=".json,.zip"
                  className="hidden"
                  onChange={handleFileImport}
                  disabled={isImporting}
                />
              </Label>
              
              <Button size="sm" onClick={() => router.push('/game-editor')}>
                <Plus className="h-4 w-4 mr-2" />
                创建游戏
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 欢迎区域 */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            欢迎来到文本冒险世界
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            使用我们的文本引擎，您可以创建、编辑和游玩精彩的文字冒险游戏。
            支持中文和英文命令，让创作变得简单而有趣。
          </p>
          
          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={() => router.push('/game-editor')}>
              <Plus className="h-5 w-5 mr-2" />
              开始创作
            </Button>
            <Button variant="outline" size="lg" onClick={() => router.push('/library')}>
              <Library className="h-5 w-5 mr-2" />
              浏览游戏库
            </Button>
          </div>
        </div>

        {/* 最近的游戏 */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">最近的游戏</h3>
            <Button variant="ghost" size="sm" onClick={() => router.push('/library')}>
              查看全部
            </Button>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : games.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-gray-500 mb-4">
                  还没有任何游戏
                </div>
                <Button onClick={() => router.push('/game-editor')}>
                  创建第一个游戏
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {games.map((game) => (
                <Card key={game.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {game.title}
                        </CardTitle>
                        {game.description && (
                          <CardDescription className="truncate mt-1">
                            {game.description}
                          </CardDescription>
                        )}
                      </div>
                      
                      {game.priority > 0 && (
                        <Badge variant="secondary" className="text-xs ml-2">
                          <Star className="h-3 w-3 mr-1" />
                          {game.priority}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {game.author && (
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="h-3 w-3 mr-1" />
                          {game.author}
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTimeAgo(game.updatedAt)}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleGamePlay(game)}
                        className="flex-1"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        开始游戏
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGameEdit(game)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        编辑
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* 功能介绍 */}
        <section className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                创建游戏
              </CardTitle>
              <CardDescription>
                使用直观的编辑器创建您的文本冒险游戏
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 支持分支剧情设计</li>
                <li>• 丰富的文本编辑功能</li>
                <li>• 实时预览和测试</li>
                <li>• 支持背景图片设置</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                导入导出
              </CardTitle>
              <CardDescription>
                轻松导入和导出您的游戏作品
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 支持JSON格式导入</li>
                <li>• ZIP压缩包支持</li>
                <li>• 批量导入导出</li>
                <li>• 数据完整性验证</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                游戏库管理
              </CardTitle>
              <CardDescription>
                智能的游戏收藏和管理系统
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 优先级排序系统</li>
                <li>• 本地数据持久化</li>
                <li>• 快速搜索和筛选</li>
                <li>• 批量操作支持</li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}