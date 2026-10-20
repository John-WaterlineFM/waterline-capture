// The alerts test's background worker (Work 015, DEC-0288 rule 2). It shows an alert that
// arrives while the app is closed, and opens the Waterline app (not this test page) when the alert is tapped.
// The badge is the Waterline mark (its blocks and the waterline cut as clear gaps), white on clear: Android draws
// the status-bar icon from its shape only, and the site's arch read as a mess at that size (John, 21 Oct 2026).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) {}
  const n = d.notification || {};
  e.waitUntil(self.registration.showNotification(n.title || 'Waterline', {
    body: n.body || '', icon: 'icon-192.png', badge: 'badge-96.png', data: {link: (d.fcmOptions && d.fcmOptions.link) || '../'}
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const link = new URL((e.notification.data && e.notification.data.link) || '../', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(ws => {
    for (const w of ws) if (w.url.split('?')[0] === link.split('?')[0] && 'focus' in w) return w.focus();
    return self.clients.openWindow(link);
  }));
});
