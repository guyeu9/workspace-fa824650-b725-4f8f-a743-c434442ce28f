'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { gameStore, GameIndexItem } from '@/lib/game-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Edit, 
  Upload, 
  Plus,
  Star,
  Clock,
  User,
  Database
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';

interface GameLibraryWidgetProps {
  maxItems?: number;
  onGameSelect?: (game: GameIndexItem) => void;
  onGamePlay?: (game: GameIndexItem) => void;
  onGameEdit?: (game: GameIndexItem) => void;
  className?: string;
}

export function GameLibraryWidget({ 
  maxItems = 3,
  onGameSelect,
  onGamePlay,
  onGameEdit,
  className = ""
}: GameLibraryWidgetProps) {
  const [games, setGames] = useState<GameIndexItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // 加载游戏列表
  const loadGames = useCallback(async () => {
    try {
      setIsLoading(true);
      const gameList = await gameStore.listGames();
      
      // 双重排序：优先级降序 + 更新时间降序
      const sortedGames = [...gameList].sort((a, b) => {
        const priorityDiff = b.priority - a.priority;
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      
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
  const handleGamePlay = (game: GameIndexItem) => {
    if (onGamePlay) {
      onGamePlay(game);
    } else {
      // 默认行为：加载游戏数据并跳转到游戏页面
      gameStore.getGame(game.id).then(result => {
        if (result) {
          sessionStorage.setItem('gameData', JSON.stringify(result.data.data));
          window.location.href = '/';
        } else {
          toast.error('无法加载游戏数据');
        }
      }).catch(error => {
        console.error('加载游戏数据失败:', error);
        toast.error('加载游戏数据失败');
      });
    }
  };

  // 处理游戏编辑
  const handleGameEdit = (game: GameIndexItem) => {
    if (onGameEdit) {
      onGameEdit(game);
    } else {
      // 默认行为：加载游戏数据并跳转到编辑器
      gameStore.getGame(game.id).then(result => {
        if (result) {
          sessionStorage.setItem('gameData', JSON.stringify(result.data.data));
          window.location.href = '/studio';
        } else {
          toast.error('无法加载游戏数据');
        }
      }).catch(error => {
        console.error('加载游戏数据失败:', error);
        toast.error('加载游戏数据失败');
      });
    }
  };

  // 处理游戏选择
  const handleGameSelect = (game: GameIndexItem) => {
    if (onGameSelect) {
      onGameSelect(game);
    }
  };

  // 格式化时间
  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: zhCN 
    });
  };

  // 显示的游戏数量
  const displayGames = showAll ? games : games.slice(0, maxItems);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            游戏库
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(maxItems)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            游戏库
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {games.length} 个游戏
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {games.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-gray-500 mb-3">
              还没有任何游戏
            </div>
            <Button 
            size="sm" 
            onClick={() => window.location.href = '/studio'}
          >
            <Plus className="h-4 w-4 mr-2" />
            创建第一个游戏
          </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {displayGames.map((game) => (
                <div
                  key={game.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => handleGameSelect(game)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {game.title}
                        </h4>
                        {game.priority > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            {game.priority}
                          </Badge>
                        )}
                      </div>
                      
                      {game.description && (
                        <p className="text-xs text-gray-600 truncate mb-2">
                          {game.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {game.author && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {game.author}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(game.updatedAt)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGamePlay(game);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGameEdit(game);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {games.length > maxItems && (
              <div className="text-center pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? '收起' : `查看全部 (${games.length})`}
                </Button>
              </div>
            )}
            
            <div className="flex gap-2 pt-3 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.href = '/studio'}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                创建游戏
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // 触发文件选择
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.json,.zip';
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      try {
                        const { enhancedGameStore } = await import('@/lib/game-importer');
                        const result = await enhancedGameStore.importGamePack(file);
                        
                        if (result.success) {
                          toast.success(`成功导入 ${result.count} 个游戏`);
                          await loadGames(); // 重新加载游戏列表
                        } else {
                          toast.error('导入失败');
                          if (result.errors.length > 0) {
                            result.errors.forEach(error => toast.error(error));
                          }
                        }
                      } catch (error) {
                        toast.error(`导入错误: ${error instanceof Error ? error.message : '未知错误'}`);
                      }
                    }
                  };
                  input.click();
                }}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                导入游戏
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}