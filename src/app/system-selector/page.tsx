'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Upload, 
  Library,
  Play,
  Settings,
  ArrowRight,
  Star,
  CheckCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SystemSelector() {
  const router = useRouter();

  const features = [
    {
      icon: <Database className="h-5 w-5" />,
      title: "IndexedDB 存储",
      description: "本地持久化存储，无需服务器"
    },
    {
      icon: <Library className="h-5 w-5" />,
      title: "游戏库管理",
      description: "完整的CRUD操作和批量管理"
    },
    {
      icon: <Upload className="h-5 w-5" />,
      title: "文件导入导出",
      description: "支持JSON和ZIP格式，自动验证"
    },
    {
      icon: <Settings className="h-5 w-5" />,
      title: "优先级排序",
      description: "智能排序算法，支持置顶功能"
    },
    {
      icon: <Play className="h-5 w-5" />,
      title: "背景图片支持",
      description: "本地存储背景图片，提升视觉效果"
    },
    {
      icon: <Star className="h-5 w-5" />,
      title: "数据验证",
      description: "完整的游戏数据验证和错误报告"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            <CheckCircle className="h-4 w-4" />
            数据持久化系统已升级
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            选择您的体验方式
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            我们为您提供了全新的数据持久化系统，支持本地存储、游戏库管理、文件导入导出等强大功能。
          </p>
        </div>

        {/* 功能展示 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 系统选择 */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* 新系统 */}
          <Card className="border-2 border-indigo-200 shadow-xl bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                  推荐
                </Badge>
                <Badge variant="outline" className="border-green-500 text-green-600">
                  新功能
                </Badge>
              </div>
              <CardTitle className="text-2xl text-indigo-900">
                增强版系统
              </CardTitle>
              <CardDescription className="text-base">
                体验完整的数据持久化功能，支持游戏库管理、文件导入导出、背景图片等高级特性
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>本地IndexedDB存储</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>游戏库CRUD管理</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>JSON/ZIP导入导出</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>背景图片支持</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>智能优先级排序</span>
                </div>
              </div>
              
              <div className="grid gap-3 pt-4">
                <Button 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  onClick={() => router.push('/enhanced-home')}
                >
                  <Play className="h-5 w-5 mr-2" />
                  开始体验
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/data-persistence-demo')}
                >
                  <Settings className="h-5 w-5 mr-2" />
                  功能演示
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 原系统 */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="border-gray-400 text-gray-600">
                  经典版
                </Badge>
                <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                  稳定
                </Badge>
              </div>
              <CardTitle className="text-2xl text-gray-900">
                经典版系统
              </CardTitle>
              <CardDescription className="text-base">
                使用原有的简单系统，适合快速体验和基础功能测试
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span>基础游戏功能</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span>简单的JSON导入</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span>基础文本渲染</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span>命令解析系统</span>
                </div>
              </div>
              
              <div className="grid gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/')}
                >
                  <Play className="h-5 w-5 mr-2" />
                  经典体验
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full text-gray-600"
                  onClick={() => router.push('/game-editor')}
                >
                  <Settings className="h-5 w-5 mr-2" />
                  经典编辑器
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 快速导航 */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-lg p-6 border">
            <Button variant="outline" onClick={() => router.push('/library')}>
              <Library className="h-4 w-4 mr-2" />
              游戏库
            </Button>
            
            <Button variant="outline" onClick={() => router.push('/enhanced-editor')}>
              <Settings className="h-4 w-4 mr-2" />
              增强编辑器
            </Button>
            
            <Button variant="outline" onClick={() => router.push('/validator')}>
              <CheckCircle className="h-4 w-4 mr-2" />
              JSON验证器
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}