import { browser } from 'webextension-polyfill-ts'

import analysePage from '../page-analysis/background'
import fetchPageData from '../page-analysis/background/fetch-page-data'
import pipeline from './pipeline'
import { Page } from './models'
import { STORAGE_KEYS as IDXING_PREF_KEYS } from '../options/settings/constants'
import { Dexie } from './types'

interface Props {
    url: string
    tabId?: number
    stubOnly?: boolean
}

export const createPageFromTab = (getDb: Promise<Dexie>) => async ({
    url,
    tabId,
    stubOnly = false,
    ...pageAnalysisArgs
}: Props) => {
    if (tabId == null) {
        throw new Error(`No tabID provided to extract content: ${url}`)
    }

    const analysisRes = await analysePage({
        tabId,
        allowFavIcon: false,
        ...pageAnalysisArgs,
    })

    if (stubOnly && analysisRes.content) {
        delete analysisRes.content.fullText
    }

    const pageData = await pipeline({
        pageDoc: { ...analysisRes, url },
        rejectNoContent: !stubOnly,
    })

    const page = new Page(pageData)
    await page.loadRels(getDb)
    return page
}

export const createPageFromUrl = (getDb: Promise<Dexie>) => async ({
    url,
    stubOnly = false,
}: Props) => {
    const fetchRes = await fetchPageData({
        url,
        opts: {
            includePageContent: true,
            includeFavIcon: false,
        },
    }).run()

    if (stubOnly && fetchRes.content) {
        delete fetchRes.content.fullText
    }

    const pageData = await pipeline({
        pageDoc: { ...fetchRes, url },
        rejectNoContent: !stubOnly,
    })

    const page = new Page(pageData)
    await page.loadRels(getDb)
    return page
}

/**
 * Decides which type of on-demand page indexing logic to run based on given props.
 * Also sets the `stubOnly` option based on user bookmark/tag indexing pref.
 * TODO: Better name?
 */
export const createPageViaBmTagActs = (getDb: Promise<Dexie>) => async (
    props: Props,
) => {
    const {
        [IDXING_PREF_KEYS.BOOKMARKS]: fullyIndex,
    } = await browser.storage.local.get(IDXING_PREF_KEYS.BOOKMARKS)

    if (props.tabId) {
        return createPageFromTab(getDb)({ stubOnly: !fullyIndex, ...props })
    }

    return createPageFromUrl(getDb)({ stubOnly: !fullyIndex, ...props })
}
