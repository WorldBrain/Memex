import urlRegex from 'url-regex'

import { OVERVIEW_URL } from 'src/background'
import { isLoggable } from 'src/activity-logger'
import { createBookmarkByUrl } from 'src/bookmarks/background/addition'

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

    // Don't do anything on non-loggable pages
    if (!isLoggable({ url: currentTab.url })) {
        return
    }

    try {
        await createBookmarkByUrl(currentTab.url, currentTab.id)

        browser.notifications.create({
            type: 'basic',
            title: 'Memex Page Bookmarked',
            iconUrl: '/img/worldbrain-logo-narrow.png',
            message: currentTab.url,
        })
    } catch (error) {}
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
