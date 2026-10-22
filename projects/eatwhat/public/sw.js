const CACHE_NAME = 'eatwhat-v1'
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
    '/favicon.ico'
]

// 1. 安装阶段：预缓存基础入口
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE)
        })
    )
    self.skipWaiting() // 强制新 Service Worker 立即接管
})

// 2. 激活阶段：清理旧版本缓存
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key)
                    }
                })
            )
        })
    )
    self.clients.claim() // 立即控制所有打开的页面
})

// 3. 请求拦截阶段：优先使用缓存，不存在则请求网络并将响应动态存入缓存
self.addEventListener('fetch', (event) => {
    // 只处理 HTTP/HTTPS 请求
    if (!event.request.url.startsWith('http')) return

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse
            }

            // 缓存没有，去网络请求
            return fetch(event.request).then((networkResponse) => {
                // 如果响应不合法，直接返回
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse
                }

                // 克隆一份响应存入缓存（动态缓存打包后的 JS / CSS 资源）
                const responseToCache = networkResponse.clone()
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache)
                })

                return networkResponse
            })
        })
    )
})