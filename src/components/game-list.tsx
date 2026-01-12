'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { gameStore, GameIndexItem } from '@/lib/game-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Star, 
  Trash2, 
  Upload, 
  Download, 
  Edit, 
  Play,
  Clock,
  Tag,
  User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface GameListProps {
  onGameSelect?: (game: GameIndexItem) => void;
  onGamePlay?: (game: GameIndexItem) => void;
  onGameEdit?: (game: GameIndexItem) => void;
  maxItems?: number;
  showControls?: boolean;
}

export function GameList({ 
  onGameSelect, 
  onGamePlay, 
  onGameEdit,
  maxItems,
  showControls = true 
}: GameListProps) {
  const [games, setGames] = useState<GameIndexItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'priority' | 'updated' | 'created'>('priority');

  // 加载游戏列表
  const loadGames = useCallback(async () => {
    try {
      setIsLoading(true);
      const gameList = await gameStore.listGames();
      
      // 排序逻辑
      const sortedGames = [...gameList].sort((a, b) => {
        switch (sortBy) {
          case 'priority':
            // 优先级降序 + 更新时间降序
            const priorityDiff = b.priority - a.priority;
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          case 'updated':
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          case 'created':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          default:
            return 0;
        }
      });

      // 应用数量限制
      const finalGames = maxItems ? sortedGames.slice(0, maxItems) : sortedGames;
      setGames(finalGames);
    } catch (error) {
      console.error('加载游戏列表失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sortBy, maxItems]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  // 处理游戏选择
  const handleGameSelect = (game: GameIndexItem) => {
    if (onGameSelect) {
      onGameSelect(game);
    }
  };

  // 处理游戏播放
  const handleGamePlay = (game: GameIndexItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onGamePlay) {
      onGamePlay(game);
    }
  };

  // 处理游戏编辑
  const handleGameEdit = (game: GameIndexItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onGameEdit) {
      onGameEdit(game);
    }
  };

  // 处理复选框选择
  const handleCheckboxChange = (gameId: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(gameId);
      } else {
        newSet.delete(gameId);
      }
      return newSet;
    });
  };

  // 处理全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(games.map(g => g.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // 处理优先级更新
  const handlePriorityUpdate = async (gameId: string, priority: number) => {
    try {
      await gameStore.updateGamePriority(gameId, priority);
      await loadGames(); // 重新加载以更新排序
    } catch (error) {
      console.error('更新优先级失败:', error);
    }
  };

  // 处理置顶
  const handlePin = async (game: GameIndexItem) => {
    try {
      const maxPriority = Math.max(0, ...games.map(g => g.priority));
      await gameStore.updateGamePriority(game.id, maxPriority + 1);
      await loadGames();
    } catch (error) {
      console.error('置顶失败:', error);
    }
  };

  // 处理删除
  const handleDelete = async (gameId: string) => {
    setDeleteTargetId(gameId);
    setShowDeleteDialog(true);
  };

  // 执行单个删除
  const executeDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await gameStore.deleteGame(deleteTargetId);
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(deleteTargetId);
        return newSet;
      });
      setShowDeleteDialog(false);
      setDeleteTargetId(null);
      await loadGames();
    } catch (error) {
      console.error('删除游戏失败:', error);
    }
  };

  // 处理批量删除
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    setShowBatchDeleteDialog(true);
  };

  // 执行批量删除
  const executeBatchDelete = async () => {
    try {
      await gameStore.deleteGames(Array.from(selectedIds));
      setSelectedIds(new Set());
      setShowBatchDeleteDialog(false);
      await loadGames();
    } catch (error) {
      console.error('批量删除失败:', error);
    }
  };

  // 格式化时间
  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: zhCN 
    });
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
    );
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">
          还没有任何游戏
        </div>
        <Button onClick={() => window.location.href = '/game-editor'}>
          创建第一个游戏
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 控制栏 */}
      {showControls && (
        <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedIds.size === games.length && games.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-gray-600">
                全选 ({selectedIds.size}/{games.length})
              </span>
            </div>
            
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除选中 ({selectedIds.size})
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="priority">按优先级排序</option>
              <option value="updated">按更新时间排序</option>
              <option value="created">按创建时间排序</option>
            </select>
          </div>
        </div>
      )}

      {/* 游戏列表 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <Card
            key={game.id}
            className="hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => handleGameSelect(game)}
          >
            <CardHeader className="pb-3">
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
                
                {showControls && (
                  <div className="flex items-center gap-1 ml-2">
                    <Checkbox
                      checked={selectedIds.has(game.id)}
                      onCheckedChange={(checked) => handleCheckboxChange(game.id, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2">
                {game.priority > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    优先级 {game.priority}
                  </Badge>
                )}
                
                {game.tags && game.tags.length > 0 && (
                  <div className="flex gap-1">
                    {game.tags.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-2">
                {game.author && (
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-3 w-3 mr-2" />
                    {game.author}
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-3 w-3 mr-2" />
                  更新于 {formatTimeAgo(game.updatedAt)}
                </div>
              </div>

              {showControls && (
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => handleGamePlay(game, e)}
                    className="flex-1"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    开始
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => handleGameEdit(game, e)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    编辑
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePin(game);
                    }}
                    className="px-2"
                  >
                    <Star className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(game.id);
                    }}
                    className="px-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 单个删除确认弹窗 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md bg-white/100 backdrop-blur-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              确认删除游戏
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              确定要删除这个游戏吗？此操作 <span className="font-bold text-red-600">不可撤销</span>，游戏数据将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel asChild>
              <button className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all cursor-pointer">
                取消
              </button>
            </AlertDialogCancel>
            <button
              onClick={executeDelete}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-lg transition-all cursor-pointer shadow-md hover:shadow-lg"
            >
              确认删除
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量删除确认弹窗 */}
      <AlertDialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
        <AlertDialogContent className="max-w-md bg-white/100 backdrop-blur-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              确认删除游戏
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              确定要删除选中的 <span className="font-bold text-red-600">{selectedIds.size}</span> 个游戏吗？
              <br /><br />
              此操作 <span className="font-bold text-red-600">不可撤销</span>，所有游戏数据将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel asChild>
              <button className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all cursor-pointer">
                取消
              </button>
            </AlertDialogCancel>
            <button
              onClick={executeBatchDelete}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-lg transition-all cursor-pointer shadow-md hover:shadow-lg"
            >
              确认删除
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}