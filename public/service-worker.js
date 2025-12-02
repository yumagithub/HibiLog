// Service Worker for HibiLog PWA
console.log('Service Worker loaded');

// Push notification handler
self.addEventListener('push', function (event) {
  console.log('Push event received:', event);
  
  if (event.data) {
    let data;
    try {
      // JSONとしてパース
      data = event.data.json();
      console.log('Parsed as JSON:', data);
    } catch (e) {
      // JSONでない場合はプレーンテキストとして扱う
      const text = event.data.text();
      console.log('Parsed as text:', text);
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
    
    console.log('Showing notification with options:', options);
    event.waitUntil(
      self.registration.showNotification(data.title, options)
        .then(() => console.log('Notification shown successfully'))
        .catch(err => console.error('Failed to show notification:', err))
    );
  } else {
    console.log('Push event has no data');
  }
})

// Notification click handler
self.addEventListener('notificationclick', function (event) {
  console.log('Notification click received.')
  event.notification.close()
  event.waitUntil(clients.openWindow('/'))
})
