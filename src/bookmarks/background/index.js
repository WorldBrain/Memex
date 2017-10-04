import { dataURLToBlob } from 'blob-util'

import fetchPageData from 'src/page-analysis/background/fetch-page-data'
import * as index from 'src/search/search-index'
import db from 'src/pouchdb'
import { transformToBookmarkDoc } from 'src/imports'
import { generatePageDocId } from 'src/page-storage'

async function getAttachments(pageData) {
    const favIconBlob = await dataURLToBlob(pageData.favIconURI)

    return {
        'fav-icon-blob': {
            content_type: favIconBlob.type,
            data: favIconBlob,
        },
    }
}

async function createNewPageForBookmark(bookmarkInfo) {
    let pageDoc = {
        url: bookmarkInfo.url,
        title: bookmarkInfo.title,
        _id: generatePageDocId({ url: bookmarkInfo.url }),
    }

    try {
        const pageData = await fetchPageData({
            url: bookmarkInfo.url,
            opts: {
                includePageContent: true,
                includeFavIcon: true,
            },
        })

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

// Store and index any new browser bookmark
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
