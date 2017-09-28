import tldjs from 'tldjs'
import { dataURLToBlob } from 'blob-util'

import 'src/activity-logger/background'
import 'src/blacklist/background'
import 'src/search/background'
import 'src/omnibar'
import { installTimeStorageKey } from 'src/imports/background'
import convertOldData from 'src/util/old-data-converter'
import fetchPageData from 'src/page-analysis/background/fetch-page-data'
import { generatePageDocId } from 'src/page-storage'
import * as index from 'src/search/search-index'
import db from 'src/pouchdb'
import { generateVisitDocId } from 'src/activity-logger'
import { generateBookmarkDocId, transformToBookmarkDoc } from 'src/imports'

export const dataConvertTimeKey = 'data-conversion-timestamp'

// Put doc ID generators on window for user use with manual DB lookups
window.generatePageDocId = generatePageDocId
window.generateVisitDocId = generateVisitDocId
window.generateBookmarkDocId = generateBookmarkDocId

// TODO: Move all this bookmarks logic away
async function getAttachments(pageData) {
    const favIconBlob = await dataURLToBlob(pageData.favIconURI)

    let _attachments = {
        'fav-icon-blob': {
            content_type: favIconBlob.type,
            data: favIconBlob,
        },
    }

    return _attachments
}

async function createNewPageForBookmark(bookmarkInfo) {
    let pageDoc = {
        url: bookmarkInfo.url,
        title: bookmarkInfo.title,
        _id: generatePageDocId({ url: bookmarkInfo.url }),
    }

    try {
        const fetchPageDataOptions = {
            includePageContent: true,
            includeFavIcon: true,
        }
        const pageData = await fetchPageData({ url: bookmarkInfo.url, opts: fetchPageDataOptions })
        pageDoc = {
            ...pageDoc,
            _attachments: await getAttachments(pageData),
            content: pageData.content,
        }
    } catch (err) {
        console.error("Error occurred while fetching page data: " + err.toString())
    } finally {
        const bookmarkDoc = transformToBookmarkDoc(pageDoc)(bookmarkInfo)
        index.addPageConcurrent({ pageDoc, bookmarkDocs: [bookmarkDoc] })
        db.bulkDocs([bookmarkDoc, pageDoc])
    }
}

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


browser.bookmarks.onCreated.addListener(async (id, bookmarkInfo) => {
    try {
        // Attempt to resolve existing page doc to connect new bookmark to
        const pageDoc = await db.get(generatePageDocId({ url: bookmarkInfo.url }))
        const bookmarkDoc = transformToBookmarkDoc(pageDoc)(bookmarkInfo)
        index.addBookmark(bookmarkDoc)
        db.bulkDocs([bookmarkDoc, pageDoc])
    } catch (error) {
        // Create new page + bookmark if existing page not found
        if (error.status === 404) {
            createNewPageForBookmark(bookmarkInfo)
        } else {
            console.error(error) // Can't handle other errors; log to background script console
        }
    }
})

browser.commands.onCommand.addListener(command => {
    if (command === 'openOverview') {
        openOverview()
    }
})

browser.runtime.onInstalled.addListener(async details => {
    // Store the timestamp of when the extension was installed in local storage
    if (details.reason === 'install') {
        browser.storage.local.set({ [installTimeStorageKey]: Date.now() })
    }
    // Attempt convert of old extension data on extension update
    if (details.reason === 'update') {
        const storage = await browser.storage.local.get(dataConvertTimeKey)
        if (!storage[dataConvertTimeKey]) {
            await convertOldData({ setAsStubs: false, concurrency: 15 })
            await browser.storage.local.set({ [dataConvertTimeKey]: Date.now() })
        }
    }
})
