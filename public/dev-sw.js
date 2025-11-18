// Workbox precache manifest placeholder
self.__WB_MANIFEST;

// Push notification handler
self.addEventListener("push", function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || "/icon-192x192.png",
      badge: "/icon-192x192.png",
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Notification click handler
self.addEventListener("notificationclick", function (event) {
  console.log("Notification click received.");
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
