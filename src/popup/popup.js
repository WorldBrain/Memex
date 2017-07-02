import { remoteFunction } from 'src/util/webextensionRPC'

const logActivePageVisit = remoteFunction('logActivePageVisit')

const storeButton = document.getElementById('store')
storeButton.onclick = async () => {
    await logActivePageVisit()
    window.close()
}

const overviewButton = document.getElementById('overview')
overviewButton.onclick = async() => {
    await browser.tabs.create({
        url: '/overview/overview.html',
    })
    window.close()
}

const loggingEnabledCheckbox = document.getElementById('loggingEnabled')
// Load initial checkbox value from storage
// (note that we do not keep this value in sync bidirectionally; should be okay for a popup).
;(async () => {
    const { loggingEnabled } = await browser.storage.local.get('loggingEnabled')
    loggingEnabledCheckbox.checked = loggingEnabled
})()
// Update the storage when loggingEnabledCheckbox value changes.
loggingEnabledCheckbox.onchange = async () => {
    browser.storage.local.set({loggingEnabled: loggingEnabledCheckbox.checked})
}
