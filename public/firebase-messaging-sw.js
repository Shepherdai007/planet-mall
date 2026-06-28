// public/firebase-messaging-sw.js
// ─── FIREBASE CLOUD MESSAGING SERVICE WORKER ─────────────────────
// Handles background push notifications when the app is closed.
// Must be in /public so it's served from the root domain.

importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:            "AIzaSyDt9JWgv4PwrVGlfI7YpIC-6hYHTt3_84E",
  authDomain:        "planet-mall-f16ec.firebaseapp.com",
  projectId:         "planet-mall-f16ec",
  storageBucket:     "planet-mall-f16ec.firebasestorage.app",
  messagingSenderId: "390650428097",
  appId:             "1:390650428097:web:4ac94ebc641ed22f3c3240",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(payload => {
  const { title, body, icon, data } = payload.notification || {};
  self.registration.showNotification(title || "Planet Mall", {
    body:  body  || "You have a new notification",
    icon:  icon  || "/logo.png",
    badge: "/logo.png",
    data:  data  || {},
    vibrate: [200, 100, 200],
  });
});

// Handle notification click — open the app to the right page
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url || "https://planetmallshop.com";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes("planetmallshop.com") && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
