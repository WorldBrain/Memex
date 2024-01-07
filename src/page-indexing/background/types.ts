import {
    ContentLocator,
    ContentIdentifier,
} from '@worldbrain/memex-common/lib/page-indexing/types'
import { ContentFingerprint } from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import {
    RemoteFunctionRole,
    RemoteFunctionWithExtraArgs,
    RemoteFunctionWithoutExtraArgs,
} from 'src/util/webextensionRPC'

export interface PageIndexingInterface<Role extends RemoteFunctionRole> {
    initContentIdentifier: RemoteFunctionWithExtraArgs<
        Role,
        InitContentIdentifierParams,
        InitContentIdentifierReturns
    >
    waitForContentIdentifier: RemoteFunctionWithExtraArgs<
        Role,
        WaitForContentIdentifierParams,
        WaitForContentIdentifierReturns
    >
    lookupPageTitleForUrl: RemoteFunctionWithoutExtraArgs<
        Role,
        { fullPageUrl: string },
        string | null
    >
}

export interface InitContentIdentifierParams {
    tabId?: number
    locator: Pick<ContentLocator, 'format' | 'originalLocation' | 'contentSize'>
    fingerprints: ContentFingerprint[]
}

export type InitContentIdentifierReturns = ContentIdentifier

export interface WaitForContentIdentifierParams {
    tabId?: number
    fullUrl: string
}

export type WaitForContentIdentifierReturns = ContentIdentifier

export enum StoredContentType {
    HtmlBody = 'htmlBody',
    PdfContent = 'pdfContent',
}

export type PagePutHandler = (event: {
    identifier: ContentIdentifier
    isNew: boolean
    isPdf?: boolean
    isLocalPdf?: boolean
    tabId?: number
}) => Promise<void>
