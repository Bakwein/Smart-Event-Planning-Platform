document.addEventListener('DOMContentLoaded', () => {
    const notificationLink = document.getElementById('notificationLink');
    const notificationBadge = document.getElementById('notificationBadge');

    if (notificationLink && notificationBadge) {
        notificationLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const response = await fetch('/notifications/read', { method: 'POST' });
            if (response.ok) {
                notificationBadge.style.display = 'none';
            }
            window.location.href = '/user/notifications';
        });
    }
});