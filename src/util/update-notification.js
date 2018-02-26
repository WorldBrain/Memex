const createTab = id => {
    browser.notifications.clear(id)
    browser.tabs.create({
        url: 'https://worldbrain.helprace.com/i34-feature-tagging',
    })
}

const updateNotification = () => {
    browser.notifications.create({
        type: 'basic',
        title: 'NEW FEATURE: Tagging',
        iconUrl: '/img/worldbrain-logo-narrow.png',
        message: 'Click for more Information',
        buttons: [{ title: 'Click for more Information' }],
    })

    browser.notifications.onButtonClicked.addListener((id, index) => {
        createTab(id)
    })

    browser.notifications.onClicked.addListener(id => {
        createTab(id)
    })
}

export default updateNotification
