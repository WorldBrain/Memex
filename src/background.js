import './activitylogger/background'

// Open the overview when the extension's button is clicked
browser.browserAction.onClicked.addListener(()=>{
    browser.tabs.create({
        url: '/overview/overview.html',
    })
})
