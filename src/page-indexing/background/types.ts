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
        {
            tabId?: number
            fullUrl: string
        },
        ContentIdentifier
    >
    getOriginalUrlForPdfPage: RemoteFunctionWithoutExtraArgs<
        Role,
        { normalizedPageUrl: string },
        string | null
    >
    getTitleForPage: RemoteFunctionWithoutExtraArgs<
        Role,
        { fullPageUrl: string },
        string | null
    >
    getFirstAccessTimeForPage: RemoteFunctionWithoutExtraArgs<
        Role,
        { normalizedPageUrl: string },
        number | null
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
    fetchPageMetadataByDOI: RemoteFunctionWithoutExtraArgs<
        Role,
        { doi: string; now?: number },
        | (Omit<PageMetadata, 'normalizedPageUrl' | 'accessDate'> & {
              entities: Omit<PageEntity, 'normalizedPageUrl'>[]
          })
        | null
    >
    setEntityOrder: RemoteFunctionWithoutExtraArgs<
        Role,
        { id: number; order: number }
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

export interface WaitForContentIdentifierParams {}

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
