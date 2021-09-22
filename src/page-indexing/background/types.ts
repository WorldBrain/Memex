import {
    ContentLocator,
    ContentIdentifier,
} from '@worldbrain/memex-common/lib/page-indexing/types'
import { ContentFingerprint } from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import {
    RemoteFunctionRole,
    RemoteFunctionWithExtraArgs,
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
