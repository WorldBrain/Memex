import { dataURLToBlob } from 'blob-util'

import fetchPageData from 'src/page-analysis/background/fetch-page-data'
import * as index from 'src/search'
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

export async function createNewPageForBookmark(id, bookmarkInfo) {
    let pageDoc = {
        _id: generatePageDocId({ url: bookmarkInfo.url }),
        url: bookmarkInfo.url,
        title: bookmarkInfo.title,
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
 * TODO: Decided if we actually need these bookmark docs in Pouch; I don't think they're being used for anything.
 *
 * @param {string} url URL to generate page ID from to associate bookmark with.
 * @throws {Error} Error thrown if page for supplied URL not indexed.
 * @returns {Promise<void>}
 */
export async function createBookmarkByUrl(url) {
    const pageId = generatePageDocId({ url })
    const pageDoc = await db.get(pageId)

    const bookmarkDoc = transformToBookmarkDoc({ _id: pageId })({
        dateAdded: Date.now(),
        title: pageDoc.content.title,
        url: pageDoc.url,
    })

    return await Promise.all([
        index.addBookmarkConcurrent(pageId),
        db.put(bookmarkDoc),
    ])
}
