const openOverviewURL = url => chrome.tabs.create({ url })

browser.runtime.onMessage.addListener(({ action, url }) => {
    if (action === 'openOverviewURL') openOverviewURL(url)
})
