import type {
    ContentLocator,
    ContentIdentifier,
} from '@worldbrain/memex-common/lib/page-indexing/types'
import type { ContentFingerprint } from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import type {
    PageEntity,
    PageMetadata,
} from '@worldbrain/memex-common/lib/types/core-data-types/client'
import type {
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
    updatePageTitle: RemoteFunctionWithExtraArgs<
        Role,
        { normaliedPageUrl: string; title: string }
    >
    updatePageMetadata: RemoteFunctionWithoutExtraArgs<
        Role,
        PageMetadataUpdateArgs
    >
    getPageMetadata: RemoteFunctionWithoutExtraArgs<
        Role,
        { normalizedPageUrl: string },
        | (Omit<PageMetadata, 'normalizedPageUrl'> & {
              entities: Omit<PageEntity, 'normalizedPageUrl'>[]
          })
        | null
    >
}

export type PageMetadataUpdateArgs = Omit<PageMetadata, 'accessDate'> & {
    accessDate?: number
    entities: Omit<PageEntity, 'normalizedPageUrl'>[]
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
