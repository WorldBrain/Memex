import { dataURLToBlob } from 'blob-util'

import fetchPageData from 'src/page-analysis/background/fetch-page-data'
import * as index from 'src/search'
import db from 'src/pouchdb'
import { transformToBookmarkDoc } from 'src/imports'
import { generatePageDocId } from 'src/page-storage'
import { generateBookmarkDocId } from 'src/bookmarks'
import storePage from 'src/page-storage/store-page'

async function getAttachments(pageData) {
    const favIconBlob = await dataURLToBlob(pageData.favIconURI)

    return {
        'fav-icon-blob': {
            content_type: favIconBlob.type,
            data: favIconBlob,
        },
    }
}

export async function createNewPageForBookmark(id, bookmarkInfo) {
    let pageDoc = {
        _id: generatePageDocId({ url: bookmarkInfo.url }),
        url: bookmarkInfo.url,
        title: bookmarkInfo.title,
    }

    try {
        const fetch = fetchPageData({
            url: bookmarkInfo.url,
            opts: {
                includePageContent: true,
                includeFavIcon: true,
            },
        })

        const pageData = await fetch.run()

        pageDoc = {
            ...pageDoc,
            _attachments: await getAttachments(pageData),
            content: pageData.content,
        }
    } catch (err) {
        console.error(
            'Error occurred while fetching page data: ',
            err.toString(),
        )
    } finally {
        const bookmarkDoc = transformToBookmarkDoc(pageDoc)(bookmarkInfo)
        index.addPageConcurrent({ pageDoc, bookmarkDocs: [bookmarkDoc] })
        db.bulkDocs([bookmarkDoc, pageDoc])
    }
}

/**
 * @param {string} url URL to generate page ID from to associate bookmark with.
 * @throws {Error} Error thrown if page for supplied URL not indexed.
 * @returns {Promise<void>}
 */
export async function createBookmarkByUrl(url, tabId) {
    const pageId = generatePageDocId({ url })

    const pageDoc = await index.initSingleLookup()(pageId)

    // Already bookmarked
    if (pageDoc != null && pageDoc.bookmarks.size > 0) {
        throw new Error(`Bookmark already exists for page with URL: ${url}`)
    }

    // Generally the page will always exist, but this is to catch that if not
    if (pageDoc == null) {
        return await index.addPageConcurrent({
            pageDoc: await storePage({ url, tabId }),
            bookmarkDocs: [
                { _id: generateBookmarkDocId({ url, timestamp: Date.now() }) },
            ],
        })
    }

    return await index.addBookmarkConcurrent(pageId)
}
