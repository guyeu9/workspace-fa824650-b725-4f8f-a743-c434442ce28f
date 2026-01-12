'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  X,
  Globe,
  Import,
  RefreshCw,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { PlatformFileDownloader } from '@/lib/platform-file-download';
import VoteButtons from '@/components/community/VoteButtons';
import CommentsSection from '@/components/community/CommentsSection';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';
import { enhancedGameStore } from '@/lib/game-importer';
import { useApi } from '@/hooks/use-api';
import { apiClient } from '@/lib/api-client';
import { GameCardSkeleton } from '@/components/ui/skeletons';
import BackupRestore from '@/components/ui/backup-restore';
import CommunityStats from '@/components/community/CommunityStats';
import GameRecommendations from '@/components/community/GameRecommendations';
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

export default function GameLibraryPage() {
  const router = useRouter();
  const [games, setGames] = useState<GameIndexItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'title' | 'updatedAt' | 'createdAt'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [viewMode, setViewMode] = useState<'local' | 'community'>('local');
  const [communityGames, setCommunityGames] = useState<any[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);

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
    setShowBatchDeleteDialog(true);
  };

  // 执行批量删除
  const executeBatchDelete = async () => {
    try {
      for (const gameId of selectedGames) {
        await gameStore.deleteGame(gameId);
      }
      toast.success(`成功删除 ${selectedGames.size} 个游戏`);
      setSelectedGames(new Set());
      setShowBatchDeleteDialog(false);
      await loadGames();
    } catch (error) {
      console.error('删除游戏失败:', error);
      toast.error('删除游戏失败');
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
        try {
          const game = gamesToExport[0];
          await PlatformFileDownloader.downloadJson(
            `${game.data.metadata.title}.json`,
            game.data.data,
            {
              onProgress: (progress) => {
                console.log(`导出进度: ${progress}%`)
              },
              onSuccess: () => {
                toast.success('游戏导出成功')
              },
              onError: (error) => {
                toast.error(`导出失败: ${error.message}`)
              }
            }
          )
        } catch (error) {
          console.error('单个游戏导出失败:', error)
          toast.error('导出游戏失败')
        }
      } else {
        try {
          const zipBlob = await enhancedGameStore.createGamePack(gamesToExport);
          await PlatformFileDownloader.downloadBlob(
            `games-export-${Date.now()}.zip`,
            zipBlob,
            {
              onProgress: (progress) => {
                console.log(`导出进度: ${progress}%`)
              },
              onSuccess: () => {
                toast.success(`成功导出 ${gamesToExport.length} 个游戏`)
              },
              onError: (error) => {
                toast.error(`导出失败: ${error.message}`)
              }
            }
          )
        } catch (error) {
          console.error('批量导出失败:', error)
          toast.error('批量导出失败')
        }
      }
    } catch (error) {
      console.error('导出游戏失败:', error);
      toast.error('导出游戏失败');
    }
  };

  // 批量调整优先级
  const handleBatchPriority = async (action: 'up' | 'down' | 'top') => {
    if (selectedGames.size === 0) {
      toast.error('请选择要调整优先级的游戏');
      return;
    }

    try {
      for (const gameId of selectedGames) {
        const game = games.find(g => g.id === gameId);
        if (game) {
          let newPriority: number;
          if (action === 'top') {
            // 置顶：设置为优先级0（显示为1）
            newPriority = 0;
          } else {
            // 上移：优先级-1（不低于0）
            // 下移：优先级+1
            newPriority = action === 'up' ? Math.max(0, game.priority - 1) : game.priority + 1;
          }
          await gameStore.updateGameMetadata(gameId, { ...game, priority: newPriority });
        }
      }
      let actionText = '';
      if (action === 'top') {
        actionText = '置顶';
      } else {
        actionText = action === 'up' ? '上移' : '下移';
      }
      toast.success(`成功${actionText} ${selectedGames.size} 个游戏的优先级`);
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
    // 调整优先级显示，从1开始
    const displayPriority = priority + 1;
    return {
      label: `优先级 ${displayPriority}`,
      color: 'bg-blue-100 text-blue-800'
    };
  };

  const loadCommunityGames = useCallback(async () => {
    try {
      setCommunityLoading(true);
      setCommunityError(null);
      const result = await apiClient.get('/games');
      if (result.success) {
        setCommunityGames(result.data);
      } else {
        throw new Error(result.error?.message || '加载社区游戏失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载社区游戏失败';
      setCommunityError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCommunityLoading(false);
    }
  }, []);

  const handleImportCommunityGame = async (gameId: string) => {
    try {
      const result = await apiClient.get(`/games/${gameId}`);
      if (result.success) {
        const gameData = result.data;
        const metadata = enhancedGameStore.extractMetadata(gameData.jsonData);
        await gameStore.createGame(metadata.title, gameData.jsonData, {
          description: metadata.description,
          author: metadata.author,
          tags: metadata.tags
        });
        toast.success('已导入到本地游戏库');
        if (viewMode === 'local') {
          await loadGames();
        }
      } else {
        throw new Error(result.error?.message || '加载社区游戏数据失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '导入游戏失败';
      toast.error(errorMessage);
    }
  };

  const publishGameToCommunity = async (gameId: string) => {
    try {
      toast.info('正在发布到社区...', { duration: 0 });
      
      const result = await gameStore.getGame(gameId);
      if (!result) {
        toast.error('无法加载本地游戏数据');
        return;
      }
      
      const metadata = enhancedGameStore.extractMetadata(result.data.data);
      const apiResult = await apiClient.post('/games', {
        title: metadata.title,
        description: metadata.description,
        jsonData: result.data.data,
      });

      if (apiResult.success) {
        toast.success('已成功发布到游戏社区！', { duration: 3000 });
        
        if (viewMode === 'community') {
          await loadCommunityGames();
        }
      } else {
        throw new Error(apiResult.error?.message || '发布到社区失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '发布到社区失败';
      console.error('发布到社区失败:', error);
      toast.error(errorMessage, { duration: 5000 });
    }
  };

  const handleBatchPublishToCommunity = async () => {
    if (selectedGames.size === 0) {
      toast.error('请选择要发布到社区的游戏');
      return;
    }
    try {
      for (const gameId of selectedGames) {
        await publishGameToCommunity(gameId);
      }
      toast.success(`成功发布 ${selectedGames.size} 个游戏到社区`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '批量发布失败');
    }
  };

  useEffect(() => {
    if (viewMode === 'community') {
      loadCommunityGames();
    }
  }, [viewMode, loadCommunityGames]);

  if (viewMode === 'local' && isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">游戏库管理</h1>
            <p className="text-slate-600">管理您的所有游戏</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GameCardSkeleton count={6} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">游戏库与社区</h1>
            <p className="text-slate-600">管理本地游戏并浏览社区作品</p>
          </div>
        </div>

        <div className="mb-4 flex gap-3">
          <Button
            variant={viewMode === 'local' ? 'default' : 'outline'}
            onClick={() => setViewMode('local')}
            className={`${viewMode === 'local' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'}`}
          >
            <Database className="h-4 w-4 mr-2" />
            本地游戏库
          </Button>
          <Button
            variant={viewMode === 'community' ? 'default' : 'outline'}
            onClick={() => setViewMode('community')}
            className={`${viewMode === 'community' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'}`}
          >
            <Globe className="h-4 w-4 mr-2" />
            游戏社区
          </Button>
        </div>

        {viewMode === 'local' && (
        <div>
        {/* 备份恢复功能 */}
        <BackupRestore className="mb-6" />

        {/* 工具栏 */}
        <div className="bg-white rounded-xl shadow-2xl p-6 mb-6 border-2 border-slate-300">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* 搜索 */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
                <Input
                  placeholder="搜索游戏..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 text-slate-800 placeholder:text-slate-400"
                />
              </div>
              
              <div className="flex gap-2">
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
                  variant="default"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={games.length === 0}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300"
                >
                  {selectedGames.size === games.length ? <X className="h-4 w-4 mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                  {selectedGames.size === games.length ? '取消全选' : '全选'}
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleBatchPriority('top')}
                  disabled={selectedGames.size === 0}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300"
                >
                  <Star className="h-4 w-4 mr-1" />
                  置顶
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleBatchPriority('up')}
                  disabled={selectedGames.size === 0}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300"
                >
                  <ChevronUp className="h-4 w-4 mr-1" />
                  上移
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleBatchPriority('down')}
                  disabled={selectedGames.size === 0}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300"
                >
                  <ChevronDown className="h-4 w-4 mr-1" />
                  下移
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleBatchExport}
                  disabled={selectedGames.size === 0}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300"
                >
                  <Download className="h-4 w-4 mr-1" />
                  导出
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleBatchDelete}
                  disabled={selectedGames.size === 0}
                  className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white transition-all duration-300"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  删除
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleBatchPublishToCommunity}
                  disabled={selectedGames.size === 0}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  发布到社区
                </Button>
            </div>
          </div>
        </div>

        {/* 游戏列表 */}
        {games.length === 0 ? (
          <div className="bg-white rounded-xl shadow-2xl p-12 text-center border-2 border-slate-300">
            <Database className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">还没有任何游戏</h3>
            <p className="text-slate-600 mb-6">开始创建您的第一个游戏吧！</p>
            <Button
                onClick={() => window.location.href = '/game-editor'}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300"
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
                  className={`transition-all duration-200 hover:shadow-2xl bg-white border-2 border-slate-300 ${
                    isSelected ? 'ring-2 ring-blue-500' : ''
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
                          <CardTitle className="text-lg font-semibold break-words">
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
                        variant="default"
                        onClick={() => handleGamePlay(game)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white transition-all duration-300"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        开始游戏
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleGameEdit(game)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        编辑
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => publishGameToCommunity(game.id)}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300"
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        发布到社区
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* 底部操作栏 */}
        <div className="mt-8 bg-white rounded-xl shadow-2xl p-4 border-2 border-slate-300">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              共 {games.length} 个游戏，已选择 {selectedGames.size} 个
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="default"
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
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white transition-all duration-300"
              >
                <Upload className="h-4 w-4 mr-2" />
                导入游戏
              </Button>
              
              <Button
                onClick={() => window.location.href = '/game-editor'}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                创建新游戏
              </Button>
            </div>
          </div>
        </div>
        </div>
        )}

        {viewMode === 'community' && (
          <div className="space-y-6">
            {/* 社区统计 */}
            <CommunityStats />
            
            {/* 推荐游戏 */}
            <GameRecommendations />
            
            {/* 社区游戏列表 */}
            <div className="bg-white rounded-xl shadow-2xl p-6 border-2 border-slate-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    游戏社区
                  </h2>
                  <p className="text-sm text-slate-500">浏览社区发布的游戏，并一键导入到本地游戏库</p>
                </div>
                <Button onClick={loadCommunityGames} variant="default" size="sm" disabled={communityLoading} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  刷新
                </Button>
              </div>
            {communityLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <GameCardSkeleton count={6} />
              </div>
            )}
            {!communityLoading && communityError && (
              <div className="py-8 text-center text-sm text-red-500">
                {communityError}
              </div>
            )}
            {!communityLoading && !communityError && communityGames.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-500">
                目前社区中还没有游戏，您可以先发布一个。
              </div>
            )}
            {!communityLoading && !communityError && communityGames.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {communityGames.map((game) => (
                  <Card 
                    key={game.id} 
                    className="flex flex-col bg-white border-2 border-slate-300 hover:shadow-2xl transition-all duration-200 cursor-pointer"
                    onClick={() => router.push(`/games/${game.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg truncate">{game.title}</CardTitle>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <User className="h-3 w-3" />
                          {game.author?.name || '匿名玩家'}
                        </div>
                        <VoteButtons
                          gameId={game.id}
                          initialUpvotes={game.upvotes}
                          initialDownvotes={game.downvotes}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      {game.coverUrl && (
                        <div className="mb-3">
                          <div
                            className="w-full h-32 rounded-md bg-cover bg-center"
                            style={{ backgroundImage: `url(${game.coverUrl})` }}
                          />
                        </div>
                      )}
                      {game.description && (
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                          {game.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(game.updatedAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {game.commentsCount}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        className="w-full mt-auto bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-md transition-all duration-300"
                        onClick={(e) => {
                          e.stopPropagation(); // 阻止事件冒泡，避免触发卡片点击
                          handleImportCommunityGame(game.id);
                        }}
                      >
                        <Import className="h-4 w-4 mr-2" />
                        一键导入到本地游戏库
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {/* 批量删除确认弹窗 */}
        <AlertDialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
          <AlertDialogContent className="max-w-md bg-white/100 backdrop-blur-none">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                确认删除游戏
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-600">
                确定要删除选中的 <span className="font-bold text-red-600">{selectedGames.size}</span> 个游戏吗？
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
    </div>
  );
}


