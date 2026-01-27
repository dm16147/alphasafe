self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Nova Assistência', body: 'Tem uma nova assistência atribuída.' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon.png',
      badge: '/badge.png'
    })
  );
});
