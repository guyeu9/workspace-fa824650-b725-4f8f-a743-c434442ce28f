'use client'

import { useSession, signOut } from 'next-auth/react'
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
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function UserNav() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const getDisplayName = (name: string | null | undefined) => {
    if (!name) return '用户'
    return name.length > 12 ? name.substring(0, 12) + '...' : name
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 px-3 rounded-full bg-gray-200 animate-pulse" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/auth/signin">
          <Button variant="default" size="sm" className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white transition-all duration-300">
            登录
          </Button>
        </Link>
        <Link href="/auth/signup">
          <Button variant="default" size="sm" className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white transition-all duration-300">
            注册
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-9 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 shadow-sm"
        >
          {getDisplayName(session.user?.name)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-white/100 shadow-md" align="end" forceMount>
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
}
