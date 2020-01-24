import { browser } from 'webextension-polyfill-ts'

import analysePage from '../page-analysis/background'
import fetchPageData from '../page-analysis/background/fetch-page-data'
import pipeline from './pipeline'
import { STORAGE_KEYS as IDXING_PREF_KEYS } from '../options/settings/constants'
import { PageCreationProps, PipelineRes } from './types'
import PageStorage from 'src/page-indexing/background/storage'

export const createPageFromTab = (pageStorage: PageStorage) => async (
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

    await pageStorage.createPageIfNotExists(pageData)
    if (props.visitTime) {
        await pageStorage.addPageVisit(pageData.url, props.visitTime)
    }

    return pageData
}

export const createPageFromUrl = (pageStorage: PageStorage) => async (
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

    await pageStorage.createPageIfNotExists(pageData)
    if (props.visitTime) {
        await pageStorage.addPageVisit(pageData.url, props.visitTime)
    }

    return pageData
}

export const createTestPage = (pageStorage: PageStorage) => async (
    props: PageCreationProps,
) => {
    const pageData = await pipeline({
        pageDoc: { url: props.url, content: {} },
        rejectNoContent: false,
    })

    await pageStorage.createPageIfNotExists(pageData)
    if (props.visitTime) {
        await pageStorage.addPageVisit(pageData.url, props.visitTime)
    }
    return pageData
}

/**
 * Decides which type of on-demand page indexing logic to run based on given props.
 * Also sets the `stubOnly` option based on user bookmark/tag indexing pref.
 * TODO: Better name?
 */
export const createPageViaBmTagActs: (
    pageStorage: PageStorage,
) => PageCreator = pageStorage => async (props: PageCreationProps) => {
    const {
        [IDXING_PREF_KEYS.BOOKMARKS]: fullyIndex,
    } = await browser.storage.local.get(IDXING_PREF_KEYS.BOOKMARKS)

    if (props.tabId) {
        return createPageFromTab(pageStorage)({
            stubOnly: !fullyIndex,
            ...props,
        })
    }

    return createPageFromUrl(pageStorage)({ stubOnly: !fullyIndex, ...props })
}

export type PageCreator = (props: PageCreationProps) => Promise<PipelineRes>
