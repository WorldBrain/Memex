import { dataURLToBlob } from 'blob-util'

import fetchPageData from 'src/page-analysis/background/fetch-page-data'
import * as index from 'src/search'
import db from 'src/pouchdb'
import { transformToLaterlistDoc } from 'src/imports'
import { generatePageDocId } from 'src/page-storage'
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

export async function createNewPageForLaterlist(id, laterlistInfo) {
    let pageDoc = {
        _id: generatePageDocId({ url: laterlistInfo.url }),
        url: laterlistInfo.url,
        title: laterlistInfo.title,
    }

    try {
        const fetch = fetchPageData({
            url: laterlistInfo.url,
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
        const laterlistDoc = transformToLaterlistDoc(pageDoc)(laterlistInfo)
        index.addPageConcurrent({ pageDoc, laterlistDocs: [laterlistDoc] })
        db.bulkDocs([laterlistDoc, pageDoc])
    }
}

async function addLaterlistDoc(pageExist, pageId, pageDoc, laterlistDoc) {
    if (pageExist) {
        return await Promise.all([
            index.addLaterlistConcurrent(pageId),
            db.put(laterlistDoc),
        ])
    } else {
        return await Promise.all([
            await index.addPageConcurrent({
                pageDoc: pageDoc,
                laterlistDocs: [laterlistDoc],
            }),
            await db.put(laterlistDoc),
        ])
    }
}

export async function createLaterlistByUrl(url, tabId = null) {
    const pageId = generatePageDocId({ url })
    let pageDoc
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

    const laterlistDoc = transformToLaterlistDoc({ _id: pageId })({
        dateAdded: timestamp,
        title: pageDoc.content.title,
        url: pageDoc.url,
    })

    await addLaterlistDoc(pageExist, pageId, pageDoc, laterlistDoc)
}
