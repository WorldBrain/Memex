import { dataURLToBlob } from 'blob-util'

import fetchPageData from 'src/page-analysis/background/fetch-page-data'
import { addPageConcurrent } from '../add'
import db from 'src/pouchdb'
import { transformToBookmarkDoc } from 'src/imports'
import { generatePageDocId } from 'src/page-storage'
import storePage from 'src/page-storage/store-page'
import { bookmarkKeyPrefix } from '../../bookmarks'
import { fetchExistingPage, makeIndexFnConcSafe } from '../util'
import index from '../'

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
        addPageConcurrent({ pageDoc, bookmarkDocs: [bookmarkDoc] })
        db.bulkDocs([bookmarkDoc, pageDoc])
    }
}

/**
 * Adds a bookmarkDoc entry into specified index doc.
 * NOTE: Assumes the existence of indexed `pageId`.
 *
 * @param {bool} pageExist PageExist or not.
 * @param {string} pageId ID of page doc to associate with.
 * @param {object} pageDoc page doc associated with pageId.
 * @param {object} bookmarkDoc bookmark doc associated with pageId.

 */
async function addBookmarkDoc(pageExist, pageId, pageDoc, bookmarkDoc) {
    if (pageExist) {
        return await Promise.all([
            addBookmarkConcurrent(pageId),
            db.put(bookmarkDoc),
        ])
    } else {
        return await Promise.all([
            await addPageConcurrent({
                pageDoc: pageDoc,
                bookmarkDocs: [bookmarkDoc],
            }),
            await db.put(bookmarkDoc),
        ])
    }
}

/**
 * TODO: Decided if we actually need these bookmark docs in Pouch; I don't think they're being used for anything.
 *
 * @param {string} url URL to generate page ID from to associate bookmark with.
 * @throws {Error} Error thrown if page for supplied URL not indexed.
 * @returns {Promise<void>}
 */
export async function createBookmarkByUrl(url, tabId = null) {
    const pageId = generatePageDocId({ url })
    let pageDoc

    // This is used for page is exist when we are bookmarking the page and default value is 1 that represents page exist in db.
    let pageExist = 1

    const timestamp = Date.now()

    try {
        pageDoc = await db.get(pageId)
    } catch (err) {
        if (err.status === 404) {
            pageExist = 0
            pageDoc = await storePage({ tabId, url })
        }
    }

    const bookmarkDoc = transformToBookmarkDoc({ _id: pageId })({
        dateAdded: timestamp,
        title: pageDoc.content.title,
        url: pageDoc.url,
    })

    await addBookmarkDoc(pageExist, pageId, pageDoc, bookmarkDoc)
}

/**
 * @param {string} pageId ID/key of document to associate new bookmark entry with.
 * @param {number|string} [timestamp=Date.now()]
 * @throws {Error} Error thrown when `pageId` param does not correspond to existing document (or any other
 *  standard indexing-related Error encountered during updates).
 */
async function addBookmark(pageId, timestamp = Date.now()) {
    const reverseIndexDoc = await fetchExistingPage(pageId)

    const bookmarkKey = `${bookmarkKeyPrefix}${timestamp}`

    // Add new entry to bookmarks index
    await index.put(bookmarkKey, { pageId })

    // Add bookmarks index key to reverse page doc and update index entry
    reverseIndexDoc.bookmarks.add(bookmarkKey)
    await index.put(pageId, reverseIndexDoc)
}

export const addBookmarkConcurrent = makeIndexFnConcSafe(addBookmark)
