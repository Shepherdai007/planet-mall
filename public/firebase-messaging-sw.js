// public/firebase-messaging-sw.js
// ─── FCM SERVICE WORKER ──────────────────────────────────────────
// Must be in /public root — Firebase looks for it at /firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:            "AIzaSyDt9JWgv4PwrVGlfI7YpIC-6hYHTt3_84E",
  authDomain:        "planet-mall-f16ec.firebaseapp.com",
  projectId:         "planet-mall-f16ec",
  storageBucket:     "planet-mall-f16ec.firebasestorage.app",
  messagingSenderId: "390650428097",
  appId:             "1:390650428097:web:4ac94ebc641ed22f3c3240",
});

const messaging = firebase.messaging();

// Handle background push notifications
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || "Planet Mall", {
    body:  body  || "",
    icon:  icon  || "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
  });
});
