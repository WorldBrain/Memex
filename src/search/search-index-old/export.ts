/* tslint:disable */
import whenAllSettled from 'when-all-settled'

import db from '../../pouchdb'
import { decode } from '../../util/encode-url-for-id'
import { ExportedPage, ExportedPageVisit, OldIndexPage } from '../migration'
import { removeKeyType, initLookupByKeys } from './util'
import index from './index'
import { PageDoc } from '../search-index-new'
import { transformUrl } from '../search-index-new/pipeline'

export interface ExportParams {
    chunkSize: number
    startKey: string
    endKey: string
}

const DEF_PARAMS: ExportParams = {
    chunkSize: 10,
    startKey: 'page/',
    endKey: 'page/\uffff',
}

async function* exportPages({
    chunkSize = DEF_PARAMS.chunkSize,
    startKey = DEF_PARAMS.startKey,
    endKey = DEF_PARAMS.endKey,
}: Partial<ExportParams> = DEF_PARAMS) {
    let lastKey = startKey
    let batch: Map<string, OldIndexPage>

    do {
        // Get batch for current key + limit, then update the key for next iteration
        batch = await fetchIndexPageBatch(lastKey, endKey, chunkSize)
        lastKey = [...batch.keys()][batch.size - 1]

        // Process each key, fetching needed data, then yielding it to caller
        const pages: Partial<ExportedPage>[] = await whenAllSettled(
            [...batch].map(processKey),
        )
        yield { pages: pages.filter(page => page != null), lastKey }
    } while (batch.size === chunkSize)
}

const fetchIndexPageBatch = (
    from: string,
    to: string,
    limit: number,
): Promise<Map<string, OldIndexPage>> =>
    new Promise((resolve, reject) => {
        const data = new Map<string, OldIndexPage>()
        ;(<any>index)
            .createReadStream({
                gte: from,
                lte: to,
                limit,
                keyAsBuffer: false,
                valueAsBuffer: false,
            })
            .on('data', ({ key, value }) => data.set(key, value))
            .on('error', err => reject(err))
            .on('end', () => resolve(data))
    })

interface VisitMeta extends ExportedPageVisit {
    pageId: string
}

interface PageAttachments {
    screenshotURI: string
    favIconURI: string
}

function deriveFallbackDisplay(url: string) {
    const { hostname, domain } = transformUrl(url)

    return {
        hostname,
        domain,
        fullUrl: `https://${url}`,
        pouchMigrationError: true,
    }
}

const attachmentToDataUrl = ({ content_type, data }) =>
    `data:${content_type};base64,${data}`

function extractAttachments(pouchDoc): Partial<PageAttachments> {
    if (!pouchDoc || !pouchDoc._attachments) {
        return {}
    }

    let favIconURI, screenshotURI
    if (pouchDoc._attachments.screenshot) {
        screenshotURI = attachmentToDataUrl(pouchDoc._attachments.screenshot)
    }
    if (pouchDoc._attachments.favIcon) {
        favIconURI = attachmentToDataUrl(pouchDoc._attachments.favIcon)
    }

    return { screenshotURI, favIconURI }
}

async function fetchPouchData(pageKey: string): Promise<Partial<ExportedPage>> {
    const pouchDoc: PageDoc = await db.get(pageKey, { attachments: true })
    const content = pouchDoc.content || {}
    const attachments = extractAttachments(pouchDoc)

    const { hostname, domain } = transformUrl(pouchDoc.url)

    return {
        fullUrl: pouchDoc.url,
        fullTitle: content.title || pouchDoc.title,
        text: content.fullText,
        lang: content.lang,
        canonicalUrl: content.canonicalUrl,
        description: content.description,
        keywords: content.keywords,
        hostname,
        domain,
        ...attachments,
    }
}

async function fetchVisitsData(visits: string[]): Promise<ExportedPageVisit[]> {
    // Grab all visit meta data
    if (!visits.length) {
        return []
    }
    const lookupMap: Map<string, VisitMeta> = await initLookupByKeys()(visits)

    // Reshape found visit index docs to ExportedPageVisit shape
    return [...lookupMap].map(([visitKey, { pageId, ...visit }]) => ({
        time: formatMetaKey(visitKey),
        ...visit,
    }))
}

async function processKey([pageKey, indexDoc]: [string, OldIndexPage]): Promise<
    Partial<ExportedPage>
> {
    // Decode the URL inside the old ID to get the new index ID
    const url = decode(removeKeyType(indexDoc.id))

    // Attempt fetching of display data, or flag as issue + fallback fullUrl (known Pouch errors in old model)
    const displayData = await fetchPouchData(pageKey).catch(err =>
        deriveFallbackDisplay(url),
    )

    const visits = await fetchVisitsData([...indexDoc.visits]).catch(
        err => console.error(err) || ([] as ExportedPageVisit[]),
    )

    return {
        url,
        terms: [...indexDoc.terms].map(removeKeyType),
        titleTerms: [...indexDoc.titleTerms].map(removeKeyType),
        urlTerms: [...indexDoc.urlTerms].map(removeKeyType),
        visits,
        bookmark: indexDoc.bookmarks.size
            ? formatMetaKey([...indexDoc.bookmarks][0])
            : undefined,
        tags: [...indexDoc.tags].map(removeKeyType),
        ...displayData,
    }
}

const formatMetaKey = (key: string) => Number.parseInt(removeKeyType(key), 10)

export default exportPages
