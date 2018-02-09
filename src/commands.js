import urlRegex from 'url-regex'

import { OVERVIEW_URL } from 'src/background'

export async function openOverview() {
    const [currentTab] = await browser.tabs.query({ active: true })

    // Either create new tab or update current tab with overview page, depending on URL validity
    if (currentTab && currentTab.url && urlRegex().test(currentTab.url)) {
        browser.tabs.create({ url: OVERVIEW_URL })
    } else {
        browser.tabs.update({ url: OVERVIEW_URL })
    }
}

export async function bookmarkPage() {
    const [currentTab] = await browser.tabs.query({ active: true })

    // TODO: actually bookmark
    browser.notifications.create({
        type: 'basic',
        title: 'Memex Page Bookmarked',
        iconUrl: '/img/worldbrain-logo-narrow.png',
        message: currentTab.url,
    })
}

// Set up commands listener
browser.commands.onCommand.addListener(command => {
    switch (command) {
        case 'openOverview':
            return openOverview()
        case 'bookmarkPage':
            return bookmarkPage()
        default:
    }
})
