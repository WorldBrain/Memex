import { browser } from 'webextension-polyfill-ts'

import analysePage from '../page-analysis/background'
import fetchPageData from '../page-analysis/background/fetch-page-data'
import pipeline from './pipeline'
import { Page } from './models'
import { STORAGE_KEYS as IDXING_PREF_KEYS } from '../options/settings/constants'
import { DBGet, PageCreationProps } from './types'

export const createPageFromTab = (getDb: DBGet) => async (
    props: PageCreationProps,
) => {
    if (!props.tabId) {
        throw new Error(`No tabID provided to extract content: ${props.url}`)
    }

    const analysisRes = await analysePage({
        tabId: props.tabId,
        allowFavIcon: false,
        ...props,
    })

    if (props.stubOnly && analysisRes.content) {
        delete analysisRes.content.fullText
    }

    const pageData = await pipeline({
        pageDoc: { ...analysisRes, url: props.url },
        rejectNoContent: !props.stubOnly,
    })
    const db = await getDb()

    const page = new Page(db, pageData)
    await page.loadRels()
    if (props.visitTime) {
        page.addVisit(props.visitTime)
    }
    if (props.save) {
        await page.save()
    }
    return page
}

export const createPageFromUrl = (getDb: DBGet) => async (
    props: PageCreationProps,
) => {
    const fetchRes = await fetchPageData({
        url: props.url,
        opts: {
            includePageContent: true,
            includeFavIcon: false,
        },
    }).run()

    if (props.stubOnly && fetchRes.content) {
        delete fetchRes.content.fullText
    }

    const pageData = await pipeline({
        pageDoc: { ...fetchRes, url: props.url },
        rejectNoContent: !props.stubOnly,
    })

    const db = await getDb()
    const page = new Page(db, pageData)
    await page.loadRels()
    if (props.visitTime) {
        page.addVisit(props.visitTime)
    }
    if (props.save) {
        await page.save()
    }
    return page
}

export const createTestPage = (getDb: DBGet) => async (
    props: PageCreationProps,
) => {
    const pageData = await pipeline({
        pageDoc: { url: props.url, content: {} },
        rejectNoContent: false,
    })

    const db = await getDb()
    const page = new Page(db, pageData)
    await page.loadRels()
    if (props.visitTime) {
        page.addVisit(props.visitTime)
    }
    if (props.save) {
        await page.save()
    }
    return page
}

/**
 * Decides which type of on-demand page indexing logic to run based on given props.
 * Also sets the `stubOnly` option based on user bookmark/tag indexing pref.
 * TODO: Better name?
 */
export const createPageViaBmTagActs: (
    getDb: DBGet,
) => PageCreator = getDb => async (props: PageCreationProps) => {
    const {
        [IDXING_PREF_KEYS.BOOKMARKS]: fullyIndex,
    } = await browser.storage.local.get(IDXING_PREF_KEYS.BOOKMARKS)

    if (props.tabId) {
        return createPageFromTab(getDb)({ stubOnly: !fullyIndex, ...props })
    }

    return createPageFromUrl(getDb)({ stubOnly: !fullyIndex, ...props })
}

export type PageCreator = (props: PageCreationProps) => Promise<Page>
