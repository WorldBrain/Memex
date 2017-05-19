import tldjs from 'tldjs'

import 'src/activity-logger/background'
import 'src/omnibar'
import { installTimeStorageKey } from 'src/imports/background'

async function openOverview() {
    const [ currentTab ] = await browser.tabs.query({ active: true })
    if (currentTab && currentTab.url) {
        const validUrl = tldjs.isValid(currentTab.url)
        if (validUrl) {
            return browser.tabs.create({
                url: '/overview/overview.html',
            })
        }
    }

    browser.tabs.update({
        url: '/overview/overview.html',
    })
}

// Open the overview when the extension's button is clicked
browser.browserAction.onClicked.addListener(() => {
    openOverview()
})

browser.commands.onCommand.addListener(command => {
    if (command === 'openOverview') {
        openOverview()
    }
})

// Store the timestamp of when the extension was installed in local storage
browser.runtime.onInstalled.addListener(details => {
    if (details.reason === 'install') {
        browser.storage.local.set({ [installTimeStorageKey]: Date.now() })
    }
})
