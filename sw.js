// sw.js — PartsGo v14.5 (28 พ.ย. 2568) — แก้บั๊ก CSP + SweetAlert2 + PWA ครบ!
const VERSION = 'v14.6';
const CACHE = `partgo-${VERSION}`;

const SHELL = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icon-152.png',
  '/icon-180.png',
  '/icon-192.png',
  '/icon-512.png',
  '/offline.html'
];

// ไฟล์ภายนอกที่อนุญาต (อัปเดตแล้ว!)
const EXTERNAL = [
  'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js',  // ใช้ all-in-one
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Itim&family=Poppins:wght@300;400;600&family=Kanit:wght@300;400;600&display=swap',
  'https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVc.ttf',
  'https://fonts.gstatic.com/s/kanit/v15/nKKZ-Go6G5tXcraBGwCKd6xLR8Y.ttf'
];

const DATA_URLS = [
  'https://opensheet.elk.sh/1nbhLKxs7NldWo_y0s4qZ8rlpIfyyGkR_Dqq8INmhYlw/MainSap',
  'https://opensheet.elk.sh/1xyy70cq2vAxGv4gPIGiL_xA5czDXqS2i6YYqW4yEVbE/Request',
  'https://opensheet.elk.sh/1dzE4Xjc7H0OtNUmne62u0jFQT-CiGsG2eBo-1v6mrZk/Call_Report',
  'https://opensheet.elk.sh/1aeGgka5ZQs3SLASOs6mOZdPJ2XotxxMbeb1-qotDZ2o/information',
  'https://opensheet.elk.sh/1nbhLKxs7NldWo_y0s4qZ8rlpIfyyGkR_Dqq8INmhYlw/MainSapimage'
];

// ติดตั้ง
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      cache.addAll(SHELL);
      return cache.addAll(EXTERNAL);
    }).then(() => self.skipWaiting())
  );
});

// ลบ cache เก่า
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// ดัก fetch
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // ข้าม POST และ script.google.com
  if (e.request.method !== 'GET' || url.href.includes('script.google.com')) {
    return;
  }

  // 1. App Shell + External (Cache First)
  if (SHELL.some(p => url.pathname === p) || EXTERNAL.includes(url.href)) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        return cached || fetch(e.request).then(res => {
          if (res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        });
      }).catch(() => {
        if (url.origin === location.origin) {
          return caches.match('/offline.html') || new Response('Offline', { status: 503 });
        }
        return new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  // 2. ข้อมูล Google Sheets (Stale-While-Revalidate)
  if (DATA_URLS.some(base => url.href.startsWith(base.split('?')[0]))) {
    e.respondWith(
      fetch(e.request).then(netRes => {
        if (netRes && netRes.status === 200) {
          const clone = netRes.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return netRes;
      }).catch(() => caches.match(e.request) || new Response('[]', {
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }

  // 3. อื่นๆ → Network First
  e.respondWith(
    fetch(e.request).catch(() => {
      if (url.origin === location.origin) {
        return caches.match('/offline.html');
      }
      return new Response('Offline', { status: 503 });
    })
  );
});

// รับข้อความจากหน้าเว็บ
self.addEventListener('message', e => {
  if (e.data?.type === 'GET_VERSION') {
    e.source.postMessage({ type: 'VERSION', version: VERSION });
  }
  if (e.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
