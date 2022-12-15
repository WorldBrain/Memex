import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { UnifiedAnnotation, UnifiedList } from './types'

export const USER_1: UserReference = {
    type: 'user-reference',
    id: TEST_USER.id,
}
export const USER_2: UserReference = {
    type: 'user-reference',
    id: 'test2@test2.com',
}

export const NORMALIZED_PAGE_URL_1 = 'test.com'
export const NORMALIZED_PAGE_URL_2 = 'test.com/test'

export const ANNOTATIONS: UnifiedAnnotation[] = [
    {
        unifiedId: '0',
        localId: NORMALIZED_PAGE_URL_1 + '/#111111111',
        normalizedPageUrl: NORMALIZED_PAGE_URL_1,
        comment: 'test comment 1',
        creator: USER_1,
        createdWhen: 1,
        lastEdited: 1,
        isBulkShareProtected: false,
        isShared: false,
        unifiedListIds: [],
    },
    {
        unifiedId: '1',
        localId: NORMALIZED_PAGE_URL_1 + '/#111111112',
        remoteId: 'remote-annot-id-1',
        normalizedPageUrl: NORMALIZED_PAGE_URL_1,
        comment: 'test comment 2',
        body: 'test highlight 2',
        selector: {
            quote: 'test highlight 2',
            descriptor: { strategy: 'hyp-anchoring', content: [] },
        },
        creator: USER_1,
        createdWhen: 2,
        lastEdited: 2,
        isBulkShareProtected: false,
        isShared: true,
        unifiedListIds: [],
    },
    {
        unifiedId: '2',
        localId: NORMALIZED_PAGE_URL_1 + '/#111111113',
        remoteId: 'remote-annot-id-2',
        normalizedPageUrl: NORMALIZED_PAGE_URL_1,
        body: 'test highlight 3',
        selector: {
            quote: 'test highlight 3',
            descriptor: { strategy: 'hyp-anchoring', content: [] },
        },
        creator: USER_1,
        createdWhen: 3,
        lastEdited: 3,
        isBulkShareProtected: true,
        isShared: true,
        unifiedListIds: [],
    },
    {
        unifiedId: '3',
        remoteId: 'remote-annot-id-3',
        normalizedPageUrl: NORMALIZED_PAGE_URL_1,
        comment: 'hi from another user',
        creator: USER_2,
        createdWhen: 3,
        lastEdited: 3,
        isBulkShareProtected: false,
        isShared: true,
        unifiedListIds: [],
    },
]

export const LISTS: UnifiedList[] = [
    {
        unifiedId: '0',
        localId: 0,
        name: 'test local list',
        creator: USER_1,
        unifiedAnnotationIds: [
            ANNOTATIONS[0].unifiedId,
            ANNOTATIONS[1].unifiedId,
        ],
    },
    {
        unifiedId: '1',
        localId: 1,
        remoteId: 'remote-list-id-1',
        name: 'test shared list',
        description: 'test list description 1',
        creator: USER_1,
        unifiedAnnotationIds: [
            ANNOTATIONS[0].unifiedId,
            ANNOTATIONS[2].unifiedId,
            ANNOTATIONS[3].unifiedId,
        ],
    },
    {
        unifiedId: '2',
        remoteId: 'remote-list-id-2',
        name: 'test followed list',
        creator: USER_2,
        unifiedAnnotationIds: [ANNOTATIONS[3].unifiedId],
    },
]
