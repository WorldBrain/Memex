import tldjs from 'tldjs'

import 'src/activity-logger/background'
import 'src/scheduled-tasks/background'
import 'src/blacklist/background'
import 'src/omnibar'
import { installTimeStorageKey } from 'src/imports/background'
import convertOldData from 'src/util/old-data-converter'
import fetchPageData from 'src/page-analysis/background/fetch-page-data'
import { findPagesByUrl } from 'src/search/find-pages'
import { transformToBookmarkDoc } from 'src/imports/background/imports-preparation'
import { dataURLToBlob } from 'blob-util'
import { generatePageDocId } from 'src/page-storage'
import db from 'src/pouchdb'

export const dataConvertTimeKey = 'data-conversion-timestamp'


export async function bookmarkStorageListener(id, bookmarkInfo) {
    const urlToFind = bookmarkInfo.url
    const samePageCandidates = (await findPagesByUrl({urlToFind})).rows.map(row => row.doc)
    if (samePageCandidates.length > 0) {
        let pageDoc = {}
        for (var i = samePageCandidates.length - 1; i >= 0; i--) {
            if (samePageCandidates[i].url === bookmarkInfo.url) {
                pageDoc = samePageCandidates[i]
                break
            }
        }
        const bookmarkDoc = await transformToBookmarkDoc(pageDoc)(bookmarkInfo)
        db.bulkDocs([bookmarkDoc, pageDoc])
        return
    }
    let pageDoc = {
        url: bookmarkInfo.url,
        title: bookmarkInfo.title,
        _id: generatePageDocId(bookmarkInfo.dateAdded, id),
    }
    try {
        console.log("Trying to get page data")
        const freezeDryFlag = window.localStorage.getItem('freeze-dry-bookmarks')
        let fetchPageDataOptions = {
            includePageContent: true,
            includeFavIcon: true,
        }
        if (freezeDryFlag) {
            fetchPageDataOptions.includeFreezeDry = true
        }
        const pageData = await fetchPageData(bookmarkInfo.url, fetchPageDataOptions)
        const favIconBlob = await dataURLToBlob(pageData.favIconURI)
        const freezeDryBlob = new Blob([pageData.freezeDryHTML], {type: 'text/html;charset=UTF-8'})
        pageDoc.content = pageData.content
        pageDoc._attachments = [{
            content_type: freezeDryBlob.type,
            data: freezeDryBlob,
        }, {
            content_type: favIconBlob.type,
            data: favIconBlob,
        }]
    } catch (err) {
        console.log("Error occurred while fetching page data: " + err.toString())
    } finally {
        const bookmarkDoc = await transformToBookmarkDoc(pageDoc, bookmarkInfo)
        console.log(bookmarkDoc)
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
