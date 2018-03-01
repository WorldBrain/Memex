const sendSaveToMemexUrl = () => browser.runtime.sendMessage('test') // test will be replaced by more specific message type e.g. twitter, etc

document.addEventListener('save-to-memex', data => {
    // Access data.detail here
    sendSaveToMemexUrl()
})
