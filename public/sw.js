const CACHE_NAME = 'text-adventure-v1'
const urlsToCache = [
  '/',
  '/offline',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json',
  // 核心CSS和JS文件将在安装时缓存
]

// 安装事件 - 缓存核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: 缓存核心资源')
      return cache.addAll(urlsToCache)
    })
  )
  self.skipWaiting()
})

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: 删除旧缓存', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// 获取事件 - 处理网络请求
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 处理API请求
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // 处理静态资源
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script' ||
      request.url.includes('.css') ||
      request.url.includes('.js')) {
    event.respondWith(handleStaticResource(request))
    return
  }

  // 处理页面导航
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request))
    return
  }

  // 默认网络优先策略
  event.respondWith(handleDefaultRequest(request))
})

// 处理API请求 - 网络优先，失败时返回缓存或错误页面
async function handleApiRequest(request) {
  try {
    const response = await fetch(request)
    
    // 如果请求成功，缓存响应
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.log('Service Worker: API请求失败，尝试缓存', request.url)
    
    // 尝试从缓存获取
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // 返回离线错误响应
    return new Response(
      JSON.stringify({ 
        error: '网络连接失败，请检查网络连接',
        offline: true 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// 处理静态资源 - 缓存优先
async function handleStaticResource(request) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    // 如果请求失败且没有缓存，返回离线页面
    return cache.match('/offline')
  }
}

// 处理页面导航 - 网络优先，失败时返回离线页面
async function handleNavigation(request) {
  try {
    const response = await fetch(request)
    return response
  } catch (error) {
    console.log('Service Worker: 页面导航失败，返回离线页面')
    const cache = await caches.open(CACHE_NAME)
    return cache.match('/offline') || new Response('离线模式 - 请检查网络连接')
  }
}

// 默认请求处理 - 网络优先
async function handleDefaultRequest(request) {
  try {
    const response = await fetch(request)
    return response
  } catch (error) {
    const cachedResponse = await caches.match(request)
    return cachedResponse || new Response('网络连接失败')
  }
}

// 推送通知事件
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '您有新的消息',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: '查看详情',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: '关闭',
        icon: '/icons/xmark.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('文字冒险游戏平台', options)
  )
})

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// 后台同步事件
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-games') {
    event.waitUntil(syncGamesData())
  }
})

// 后台数据同步
async function syncGamesData() {
  try {
    // 获取待同步的数据
    const cache = await caches.open(CACHE_NAME)
    const requests = await cache.keys()
    
    // 同步游戏数据
    for (const request of requests) {
      if (request.url.includes('/api/games') && request.method === 'POST') {
        const response = await cache.match(request)
        if (response) {
          const data = await response.json()
          // 发送到服务器
          await fetch(request.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
          })
          
          // 同步完成后删除缓存的请求
          cache.delete(request)
        }
      }
    }
  } catch (error) {
    console.error('Service Worker: 数据同步失败', error)
  }
}

// 消息事件 - 处理来自客户端的消息
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_NEW_GAME') {
    // 缓存新创建的游戏数据
    cacheNewGame(event.data.gameData)
  }
})

// 缓存新游戏数据
async function cacheNewGame(gameData) {
  try {
    const cache = await caches.open(CACHE_NAME)
    const response = new Response(JSON.stringify(gameData), {
      headers: { 'Content-Type': 'application/json' }
    })
    
    // 缓存游戏数据
    cache.put(`/api/games/${gameData.id}`, response)
    
    // 更新游戏列表缓存
    const gamesListResponse = await cache.match('/api/games')
    if (gamesListResponse) {
      const gamesList = await gamesListResponse.json()
      gamesList.items.push(gameData)
      
      const updatedResponse = new Response(JSON.stringify(gamesList), {
        headers: { 'Content-Type': 'application/json' }
      })
      
      cache.put('/api/games', updatedResponse)
    }
  } catch (error) {
    console.error('Service Worker: 缓存新游戏失败', error)
  }
}