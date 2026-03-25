// Nova Dashboard — Service Worker
// Handles push notifications and daily briefing alarms

const CACHE = 'nova-v1';

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// ── PUSH NOTIFICATIONS ──
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  const title = data.title || 'Nova';
  const body  = data.body  || 'You have a reminder.';
  const icon  = data.icon  || '/Nova-Dashboard/icon-192.png';
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: icon,
      tag: data.tag || 'nova-reminder',
      renotify: true,
      data: { url: data.url || 'https://ligourio.github.io/Nova-Dashboard' },
      actions: [
        { action: 'open',    title: 'Open Nova' },
        { action: 'dismiss', title: 'Dismiss'   },
      ],
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const url = e.notification.data?.url || 'https://ligourio.github.io/Nova-Dashboard';
      const match = list.find(c => c.url === url);
      if (match) return match.focus();
      return clients.openWindow(url);
    })
  );
});

// ── DAILY BRIEFING ALARM (via setTimeout loop, ~8am) ──
// The page registers the alarm when the SW starts; it re-registers on each wake.
self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_BRIEFING') {
    scheduleBriefing(e.data.events || []);
  }
  if (e.data?.type === 'REMIND_EVENT') {
    const { title, time } = e.data;
    self.registration.showNotification('📅 Coming up: ' + title, {
      body: 'Starting at ' + time,
      icon: '/Nova-Dashboard/icon-192.png',
      tag: 'event-' + title,
    });
  }
});

function scheduleBriefing(events) {
  const now  = new Date();
  const next = new Date();
  next.setHours(8, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const delay = next - now;

  setTimeout(() => {
    const evtList = events.slice(0, 4).map(ev => `• ${ev.title}`).join('\n') || 'No events today.';
    self.registration.showNotification('☀️ Good morning, Demetri!', {
      body: "Here's your day:\n" + evtList,
      icon: '/Nova-Dashboard/icon-192.png',
      tag: 'daily-briefing',
      requireInteraction: false,
    });
  }, delay);
}
