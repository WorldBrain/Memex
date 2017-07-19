import tldjs from 'tldjs'

import 'src/activity-logger/background'
import 'src/scheduled-tasks/background'
import 'src/blacklist/background'
import 'src/omnibar'
import { installTimeStorageKey } from 'src/imports/background'
import convertOldData from 'src/util/old-data-converter'
import fetchPageData from 'src/page-analysis/background/fetch-page-data'
import findPagesByUrl from 'src/search/find-pages'
import tryReidentifyPage from 'src/page-storage/store-page'
import transformToBookmarkDoc from 'src/imports/background/import-preparation'
import formatFavIconAttachment from 'src/imports/background'

export const dataConvertTimeKey = 'data-conversion-timestamp'


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


browser.bookmarks.onCreated.addListener((id, bookmarkInfo) => {
    //TO-DO Add method to handle indexing of bookmark
    //bookmarkInfo.url gives the URL of the bookmark
    //id is the unique id of the bookmark
    //https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/bookmarks/onCreated
    //Check if there already exists a page with this URL.
    const samePageCandidates = (await findPagesByUrl({url})).rows.map(row => row.doc);
    const reusablePage = await tryReidentifyPage({null, bookmarkInfo.url, samePageCandidates})
    const pageData = fetchPageData(bookmarkInfo.url)
    const favIconAttachment = formatFavIconAttachment(pageData.favIconURI)
    const freezeDryBlob = new Blob([pageData.freezeDryHTML], {type: 'text/html;charset=UTF-8'})
    const pageDoc = {
        url: bookmarkInfo.url,
        content: pageData.content,
        _id: getPageId(pageData),
        _attachments: {
            'favIcon': favIconAttachment,
            'frozen-page.html': freezeDryBlob
        }
    }
    const bookmarkDoc = transformToBookmarkDoc(pageDoc, bookmarkInfo)
    db.put(bookmarkDoc);
    db.put(pageDoc);
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
