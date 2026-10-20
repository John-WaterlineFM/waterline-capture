// The alerts test's background worker (Work 015, DEC-0288 rule 2). It shows an alert that
// arrives while the app is closed, and opens the app when the alert is tapped. Nothing else.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) {}
  const n = d.notification || {};
  e.waitUntil(self.registration.showNotification(n.title || 'Waterline', {
    body: n.body || '', icon: 'icon-192.png', badge: 'icon-192.png', data: {link: (d.fcmOptions && d.fcmOptions.link) || './'}
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(ws => {
    for (const w of ws) if ('focus' in w) return w.focus();
    return self.clients.openWindow('./');
  }));
});
