'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  User, 
  LogOut, 
  Settings, 
  Shield,
  Gamepad2,
  Library,
  Plus,
  Menu,
  X,
  FileText
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

interface UserNavProps {
  className?: string
}

export default function ResponsiveUserNav({ className = '' }: UserNavProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.charAt(0).toUpperCase()
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  if (status === 'loading') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Link href="/auth/signin">
          <Button variant="outline" size="sm" className="hidden sm:inline-flex">
            登录
          </Button>
        </Link>
        <Link href="/auth/signup">
          <Button size="sm" className="hidden sm:inline-flex">
            注册
          </Button>
        </Link>
        
        {/* 移动端菜单 */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="sm:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle>菜单</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <Link href="/auth/signin" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  登录
                </Button>
              </Link>
              <Link href="/auth/signup" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full">
                  注册
                </Button>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  const UserDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {getInitials(session.user?.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {session.user?.name || '用户'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {session.user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <Link href="/game-library">
          <DropdownMenuItem>
            <Library className="mr-2 h-4 w-4" />
            <span>游戏库</span>
          </DropdownMenuItem>
        </Link>
        
        <Link href="/game-editor">
          <DropdownMenuItem>
            <Plus className="mr-2 h-4 w-4" />
            <span>创建游戏</span>
          </DropdownMenuItem>
        </Link>
        <a href="https://simplefeedback.app/feedback/nDf7Lhk7Ohnw" target="_blank" rel="noopener noreferrer">
          <DropdownMenuItem>
            <FileText className="mr-2 h-4 w-4" />
            <span>更新日志及反馈</span>
          </DropdownMenuItem>
        </a>
        
        {(session.user?.role === 'ADMIN' || session.user?.role === 'SUPER_ADMIN') && (
          <>
            <DropdownMenuSeparator />
            <Link href="/admin">
              <DropdownMenuItem>
                <Shield className="mr-2 h-4 w-4" />
                <span>管理后台</span>
              </DropdownMenuItem>
            </Link>
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>个人设置</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* 桌面端用户菜单 */}
      <div className="hidden sm:block">
        <UserDropdown />
      </div>
      
      {/* 移动端菜单 */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="sm:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle>菜单</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {getInitials(session.user?.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{session.user?.name || '用户'}</p>
                <p className="text-sm text-gray-500">{session.user?.email}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Link href="/game-library" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <Library className="mr-2 h-4 w-4" />
                  游戏库
                </Button>
              </Link>
              
              <Link href="/game-editor" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  创建游戏
                </Button>
              </Link>
              <a href="https://simplefeedback.app/feedback/nDf7Lhk7Ohnw" target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  更新日志及反馈
                </Button>
              </a>
              
              {(session.user?.role === 'ADMIN' || session.user?.role === 'SUPER_ADMIN') && (
                <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Shield className="mr-2 h-4 w-4" />
                    管理后台
                  </Button>
                </Link>
              )}
              
              <Button variant="ghost" className="w-full justify-start">
                <User className="mr-2 h-4 w-4" />
                个人设置
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-600 hover:text-red-700"
                onClick={() => {
                  handleSignOut()
                  setIsMenuOpen(false)
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                退出登录
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}