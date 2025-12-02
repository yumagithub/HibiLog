// Service Worker for HibiLog PWA
// Push notification handler
self.addEventListener('push', function (event) {
  if (event.data) {
    let data;
    try {
      // JSONとしてパース
      data = event.data.json();
    } catch (e) {
      // JSONでない場合はプレーンテキストとして扱う
      const text = event.data.text();
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
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
})

// Notification click handler
self.addEventListener('notificationclick', function (event) {
  console.log('Notification click received.')
  event.notification.close()
  event.waitUntil(clients.openWindow('/'))
})