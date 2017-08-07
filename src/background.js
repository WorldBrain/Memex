import tldjs from 'tldjs'
import { dataURLToBlob } from 'blob-util'

import 'src/activity-logger/background'
import 'src/scheduled-tasks/background'
import 'src/blacklist/background'
import 'src/omnibar'
import { installTimeStorageKey } from 'src/imports/background'
import convertOldData from 'src/util/old-data-converter'
import fetchPageData from 'src/page-analysis/background/fetch-page-data'
import { findPagesByUrl } from 'src/search/find-pages'
import { transformToBookmarkDoc } from 'src/imports/background/imports-preparation'
import { generatePageDocId } from 'src/page-storage'
import { FREEZE_DRY_BOOKMARKS_KEY } from 'src/options/preferences/constants'
import * as index from 'src/search/search-index'
import db from 'src/pouchdb'

export const dataConvertTimeKey = 'data-conversion-timestamp'


export async function bookmarkStorageListener(id, bookmarkInfo) {
    const getAttachments = async pageData => {
        const favIconBlob = await dataURLToBlob(pageData.favIconURI)

        let _attachments = {
            'fav-icon-blob': {
                content_type: favIconBlob.type,
                data: favIconBlob,
            },
        }

        if (pageData.freezeDryHTML) {
            const freezeDryBlob = new Blob([pageData.freezeDryHTML], {type: 'text/html;charset=UTF-8'})

            _attachments = {
                ..._attachments,
                'freeze-dry-blob': {
                    content_type: freezeDryBlob.type,
                    data: freezeDryBlob,
                },
            }
        }

        return _attachments
    }

    const samePageCandidates = (await findPagesByUrl({ url: bookmarkInfo.url })).rows.map(row => row.doc)

    if (samePageCandidates.length) {
        const pageDoc = samePageCandidates[samePageCandidates.length - 1]
        const bookmarkDoc = await transformToBookmarkDoc(pageDoc)(bookmarkInfo)
        index.addBookmark(bookmarkDoc)
        return db.bulkDocs([bookmarkDoc, pageDoc])
    }

    let pageDoc = {
        url: bookmarkInfo.url,
        title: bookmarkInfo.title,
        _id: generatePageDocId(bookmarkInfo.dateAdded, id),
    }

    try {
        const { [FREEZE_DRY_BOOKMARKS_KEY]: includeFreezeDry = false } = await browser.storage.local.get(FREEZE_DRY_BOOKMARKS_KEY)

        const fetchPageDataOptions = {
            includePageContent: true,
            includeFavIcon: true,
            includeFreezeDry,
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
        const bookmarkDoc = await transformToBookmarkDoc(pageDoc)(bookmarkInfo)
        index.addPage({ pageDoc, bookmarkDocs: [bookmarkDoc] })
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


browser.bookmarks.onCreated.addListener(bookmarkStorageListener)

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
