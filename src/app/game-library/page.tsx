'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { gameStore, GameIndexItem } from '@/lib/game-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Play, 
  Edit, 
  Upload, 
  Download,
  Plus,
  Star,
  Clock,
  User,
  Database,
  Trash2,
  Settings,
  Filter,
  Search,
  ArrowUpDown,
  Check,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';
import { enhancedGameStore } from '@/lib/game-importer';

export default function GameLibraryPage() {
  const [games, setGames] = useState<GameIndexItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'title' | 'updatedAt' | 'createdAt'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // 加载游戏列表
  const loadGames = useCallback(async () => {
    try {
      setIsLoading(true);
      const gameList = await gameStore.listGames();
      
      // 根据排序和筛选条件处理游戏列表
      let filteredGames = gameList.filter(game => {
        // 搜索筛选
        if (searchTerm && !game.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
            !game.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        
        // 优先级筛选
        if (filterPriority !== 'all') {
          const priorityMap = { 'high': 2, 'medium': 1, 'low': 0 };
          if (game.priority !== priorityMap[filterPriority]) {
            return false;
          }
        }
        
        return true;
      });
      
      // 排序
      filteredGames.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'priority':
            comparison = b.priority - a.priority;
            break;
          case 'title':
            comparison = a.title.localeCompare(b.title);
            break;
          case 'updatedAt':
            comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            break;
          case 'createdAt':
            comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            break;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      
      setGames(filteredGames);
    } catch (error) {
      console.error('加载游戏列表失败:', error);
      toast.error('加载游戏列表失败');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, sortBy, sortOrder, filterPriority]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  // 处理游戏选择
  const handleGameSelect = (gameId: string) => {
    const newSelected = new Set(selectedGames);
    if (newSelected.has(gameId)) {
      newSelected.delete(gameId);
    } else {
      newSelected.add(gameId);
    }
    setSelectedGames(newSelected);
  };

  // 处理游戏播放
  const handleGamePlay = async (game: GameIndexItem) => {
    try {
      const result = await gameStore.getGame(game.id);
      if (result) {
        sessionStorage.setItem('gameData', JSON.stringify(result.data.data));
        window.location.href = '/';
      } else {
        toast.error('无法加载游戏数据');
      }
    } catch (error) {
      console.error('加载游戏数据失败:', error);
      toast.error('加载游戏数据失败');
    }
  };

  // 处理游戏编辑
  const handleGameEdit = async (game: GameIndexItem) => {
    try {
      const result = await gameStore.getGame(game.id);
      if (result) {
        sessionStorage.setItem('gameData', JSON.stringify(result.data.data));
        window.location.href = '/game-editor';
      } else {
        toast.error('无法加载游戏数据');
      }
    } catch (error) {
      console.error('加载游戏数据失败:', error);
      toast.error('加载游戏数据失败');
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedGames.size === 0) {
      toast.error('请选择要删除的游戏');
      return;
    }

    if (confirm(`确定要删除选中的 ${selectedGames.size} 个游戏吗？此操作不可恢复。`)) {
      try {
        for (const gameId of selectedGames) {
          await gameStore.deleteGame(gameId);
        }
        toast.success(`成功删除 ${selectedGames.size} 个游戏`);
        setSelectedGames(new Set());
        await loadGames();
      } catch (error) {
        console.error('删除游戏失败:', error);
        toast.error('删除游戏失败');
      }
    }
  };

  // 批量导出
  const handleBatchExport = async () => {
    if (selectedGames.size === 0) {
      toast.error('请选择要导出的游戏');
      return;
    }

    try {
      const gamesToExport = [];
      for (const gameId of selectedGames) {
        const result = await gameStore.getGame(gameId);
        if (result) {
          gamesToExport.push(result);
        }
      }

      if (gamesToExport.length === 1) {
        // 单个游戏导出
        const game = gamesToExport[0];
        const blob = new Blob([JSON.stringify(game.data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${game.data.metadata.title}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('游戏导出成功');
      } else {
        // 批量导出为ZIP
        const zipBlob = await enhancedGameStore.createGamePack(gamesToExport);
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `games-export-${Date.now()}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`成功导出 ${gamesToExport.length} 个游戏`);
      }
    } catch (error) {
      console.error('导出游戏失败:', error);
      toast.error('导出游戏失败');
    }
  };

  // 批量调整优先级
  const handleBatchPriority = async (priority: number) => {
    if (selectedGames.size === 0) {
      toast.error('请选择要调整优先级的游戏');
      return;
    }

    try {
      for (const gameId of selectedGames) {
        const game = games.find(g => g.id === gameId);
        if (game) {
          await gameStore.updateGameMetadata(gameId, { ...game, priority });
        }
      }
      toast.success(`成功调整 ${selectedGames.size} 个游戏的优先级`);
      await loadGames();
    } catch (error) {
      console.error('调整优先级失败:', error);
      toast.error('调整优先级失败');
    }
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedGames.size === games.length) {
      setSelectedGames(new Set());
    } else {
      setSelectedGames(new Set(games.map(g => g.id)));
    }
  };

  // 格式化时间
  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: zhCN 
    });
  };

  // 获取优先级标签
  const getPriorityLabel = (priority: number) => {
    const labels = { 0: '普通', 1: '重要', 2: '置顶' };
    const colors = { 0: 'bg-gray-100 text-gray-800', 1: 'bg-blue-100 text-blue-800', 2: 'bg-red-100 text-red-800' };
    return {
      label: labels[priority as keyof typeof labels] || '普通',
      color: colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">游戏库管理</h1>
            <p className="text-slate-600">管理您的所有游戏</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">游戏库管理</h1>
          <p className="text-slate-600">管理您的所有游戏</p>
        </div>

        {/* 工具栏 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* 搜索和筛选 */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索游戏..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">所有优先级</option>
                  <option value="high">置顶</option>
                  <option value="medium">重要</option>
                  <option value="low">普通</option>
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="priority">按优先级</option>
                  <option value="title">按标题</option>
                  <option value="updatedAt">按更新时间</option>
                  <option value="createdAt">按创建时间</option>
                </select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 批量操作 */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={games.length === 0}
              >
                {selectedGames.size === games.length ? <X className="h-4 w-4 mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                {selectedGames.size === games.length ? '取消全选' : '全选'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchPriority(2)}
                disabled={selectedGames.size === 0}
              >
                <Star className="h-4 w-4 mr-1" />
                置顶
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchPriority(1)}
                disabled={selectedGames.size === 0}
              >
                重要
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchPriority(0)}
                disabled={selectedGames.size === 0}
              >
                普通
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchExport}
                disabled={selectedGames.size === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                导出
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchDelete}
                disabled={selectedGames.size === 0}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                删除
              </Button>
            </div>
          </div>
        </div>

        {/* 游戏列表 */}
        {games.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">还没有任何游戏</h3>
            <p className="text-gray-600 mb-6">开始创建您的第一个游戏吧！</p>
            <Button 
              onClick={() => window.location.href = '/game-editor'}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              创建第一个游戏
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => {
              const priority = getPriorityLabel(game.priority);
              const isSelected = selectedGames.has(game.id);
              
              return (
                <Card 
                  key={game.id} 
                  className={`transition-all duration-200 hover:shadow-lg ${
                    isSelected ? 'ring-2 ring-indigo-500' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleGameSelect(game.id)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold truncate">
                            {game.title}
                          </CardTitle>
                          {game.author && (
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                              <User className="h-3 w-3" />
                              {game.author}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge className={`${priority.color} text-xs`}>
                        {priority.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {game.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {game.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(game.updatedAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {game.priority}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
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
              );
            })}
          </div>
        )}

        {/* 底部操作栏 */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              共 {games.length} 个游戏，已选择 {selectedGames.size} 个
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.json,.zip';
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      try {
                        const result = await enhancedGameStore.importGamePack(file);
                        if (result.success) {
                          toast.success(`成功导入 ${result.count} 个游戏`);
                          await loadGames();
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
              >
                <Upload className="h-4 w-4 mr-2" />
                导入游戏
              </Button>
              
              <Button
                onClick={() => window.location.href = '/game-editor'}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                创建新游戏
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}