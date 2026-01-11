'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Gamepad2, Library, Plus, Home, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import UserNav from './UserNav'

export default function MainNav() {
  const router = useRouter()
  
  const handleHomeClick = () => {
    sessionStorage.setItem('resetGame', 'true')
    window.location.href = '/'
  }
  
  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button onClick={handleHomeClick} className="flex items-center space-x-2">
            <Gamepad2 className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900 hidden sm:inline">文字冒险</span>
            <span className="text-lg font-bold text-gray-900 sm:hidden">文字</span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              onClick={handleHomeClick}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300"
            >
              <Home className="h-4 w-4" />
              <span>首页</span>
            </Button>
            <Button
              asChild
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300"
            >
              <Link href="/game-library" className="flex items-center gap-2">
                <Library className="h-4 w-4" />
                <span>游戏库</span>
              </Link>
            </Button>
            <Button
              asChild
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white transition-all duration-300"
            >
              <Link href="/game-editor" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>创建游戏</span>
              </Link>
            </Button>
          </div>

          {/* User Navigation and Mobile Menu */}
          <div className="flex items-center space-x-2">
            {/* User Actions - 使用现有UserNav组件 */}
            <UserNav />

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="sm:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-4 py-6">
                  <div className="flex items-center justify-between">
                    <button onClick={handleHomeClick} className="flex items-center gap-2">
                      <Gamepad2 className="h-6 w-6 text-blue-600" />
                      <span className="text-lg font-bold">文字冒险</span>
                    </button>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close menu</span>
                      </Button>
                    </SheetTrigger>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleHomeClick}
                      className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-gray-100 transition-colors text-left"
                    >
                      <Home className="h-4 w-4" />
                      <span>首页</span>
                    </button>
                    <Link 
                      href="/game-library" 
                      className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <Library className="h-4 w-4" />
                      <span>游戏库</span>
                    </Link>
                    <Link 
                      href="/game-editor" 
                      className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>创建游戏</span>
                    </Link>
                    
                    <div className="pt-4 border-t">
                      <div className="flex flex-col gap-2">
                        <Link href="/auth/signin">
                          <Button className="w-full">登录</Button>
                        </Link>
                        <Link href="/auth/signup">
                          <Button className="w-full bg-primary text-primary-foreground">注册</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}