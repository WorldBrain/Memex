const updateNotification = () => {
    browser.notifications.create({
        type: 'basic',
        title: 'NEW FEATURE: Tagging',
        iconUrl: '/img/worldbrain-logo-narrow.png',
        message: 'Click for more Information',
        buttons: [{ title: 'Click for more Information' }],
    })

    browser.notifications.onButtonClicked.addListener((id, index) => {
        browser.notifications.clear(id)
        window.open('https://worldbrain.helprace.com/i34-feature-tagging')
    })
}

export default updateNotification
