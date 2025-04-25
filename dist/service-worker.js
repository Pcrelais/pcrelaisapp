// Service Worker pour les notifications push
const CACHE_NAME = 'pc-relais-cache-v1';

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installé');
  self.skipWaiting();
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activé');
  return self.clients.claim();
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Notification push reçue sans données');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Notification push reçue:', data);

    const title = data.title || 'PC Relais';
    const options = {
      body: data.body || 'Vous avez une nouvelle notification',
      icon: '/logo192.png',
      badge: '/badge.png',
      tag: data.tag || 'default',
      data: {
        url: data.url || '/',
        requestId: data.requestId
      }
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('Erreur lors du traitement de la notification push:', error);
  }
});

// Gestion du clic sur une notification
self.addEventListener('notificationclick', (event) => {
  console.log('Notification cliquée:', event.notification);
  event.notification.close();

  const url = event.notification.data.url;
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Vérifier si une fenêtre est déjà ouverte et la focaliser
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Sinon, ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Gestion des messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
