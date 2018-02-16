const updateNotification = () => {
    document.addEventListener('DOMContentLoaded', () => {
        if (Notification.permission !== 'granted') {
            Notification.requestPermission()
        }
    })
    if (!Notification) {
        alert(
            'Desktop notifications not available in your browser. Try Chromium.',
        )
        return
    }

    if (Notification.permission !== 'granted') {
        Notification.requestPermission()
    } else {
        const notification = new Notification('NEW FEATURE: Tagging', {
            icon: '/img/worldbrain-logo-narrow.png',
            body: 'More Information',
        })

        notification.onclick = () => {
            window.open('https://google.com')
        }
    }
}

export default updateNotification
