// Service Worker for HibiLog PWA
// Push notification handler
self.addEventListener('push', function (event) {
  console.log('[Service Worker] Push event received:', event);
  
  if (event.data) {
    let data;
    try {
      // JSONとしてパース
      data = event.data.json();
      console.log('[Service Worker] Push data (JSON):', data);
    } catch (e) {
      // JSONでない場合はプレーンテキストとして扱う
      console.log('[Service Worker] Push data parse error:', e);
      const text = event.data.text();
      console.log('[Service Worker] Push data (text):', text);
      data = {
        title: 'HibiLog',
        body: text,
      };
    }
    
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
      },
    };
    
    console.log('[Service Worker] Showing notification:', data.title, options);
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
        .then(() => console.log('[Service Worker] Notification shown successfully'))
        .catch(err => console.error('[Service Worker] Notification error:', err))
    );
  } else {
    console.log('[Service Worker] Push event has no data');
  }
})

// Notification click handler
self.addEventListener('notificationclick', function (event) {
  console.log('Notification click received.')
  event.notification.close()
  event.waitUntil(clients.openWindow('/'))
})