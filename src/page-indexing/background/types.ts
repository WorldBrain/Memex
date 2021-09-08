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
}

export interface InitContentIdentifierParams {
    locator: Pick<ContentLocator, 'format' | 'originalLocation' | 'contentSize'>
    fingerprints: ContentFingerprint[]
}

export interface InitContentIdentifierReturns {
    identifier: ContentIdentifier
}

export enum StoredContentType {
    HtmlBody = 'htmlBody',
    PdfContent = 'pdfContent',
}
