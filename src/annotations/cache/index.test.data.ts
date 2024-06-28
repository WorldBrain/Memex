import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
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

const ANNOTATION_IDS = ['0', '1', '2', '3']
const LIST_IDS = ['0', '1', '2', '3']

export function ANNOTATIONS(): UnifiedAnnotation[] {
    return [
        {
            unifiedId: ANNOTATION_IDS[0],
            localId: NORMALIZED_PAGE_URL_1 + '/#111111111',
            normalizedPageUrl: NORMALIZED_PAGE_URL_1,
            comment: 'test comment 1',
            creator: USER_1,
            createdWhen: 1,
            lastEdited: 1,
            color: 'default',
            unifiedListIds: [LIST_IDS[0], LIST_IDS[1]],
            privacyLevel: AnnotationPrivacyLevels.PROTECTED,
        },
        {
            unifiedId: ANNOTATION_IDS[1],
            localId: NORMALIZED_PAGE_URL_1 + '/#111111112',
            remoteId: 'remote-annot-id-1',
            normalizedPageUrl: NORMALIZED_PAGE_URL_1,
            comment: 'test comment 2',
            body: 'test highlight 2',
            color: 'default',
            selector: {
                quote: 'test highlight 2',
                descriptor: { strategy: 'hyp-anchoring', content: [] },
            },
            creator: USER_1,
            createdWhen: 2,
            lastEdited: 2,
            unifiedListIds: [LIST_IDS[0]],
            privacyLevel: AnnotationPrivacyLevels.PRIVATE,
        },
        {
            unifiedId: ANNOTATION_IDS[2],
            localId: NORMALIZED_PAGE_URL_1 + '/#111111113',
            remoteId: 'remote-annot-id-2',
            color: 'default',
            normalizedPageUrl: NORMALIZED_PAGE_URL_1,
            body: 'test highlight 3',
            selector: {
                quote: 'test highlight 3',
                descriptor: { strategy: 'hyp-anchoring', content: [] },
            },
            creator: USER_1,
            createdWhen: 3,
            lastEdited: 3,
            unifiedListIds: [LIST_IDS[1]],
            privacyLevel: AnnotationPrivacyLevels.PROTECTED,
        },
        {
            unifiedId: ANNOTATION_IDS[3],
            remoteId: 'remote-annot-id-3',
            color: 'default',
            normalizedPageUrl: NORMALIZED_PAGE_URL_1,
            comment: 'hi from another user',
            creator: USER_2,
            createdWhen: 3,
            lastEdited: 3,
            unifiedListIds: [LIST_IDS[0]],
            privacyLevel: AnnotationPrivacyLevels.SHARED,
        },
    ]
}

export function LISTS(): UnifiedList[] {
    return [
        {
            type: 'user-list',
            unifiedId: LIST_IDS[0],
            localId: 0,
            name: 'test local list',
            hasRemoteAnnotationsToLoad: false,
            creator: USER_1,
            order: 0,
            pathLocalIds: [],
            pathUnifiedIds: [],
            parentLocalId: null,
            parentUnifiedId: null,
            unifiedAnnotationIds: [ANNOTATION_IDS[0], ANNOTATION_IDS[1]],
        },
        {
            type: 'user-list',
            unifiedId: LIST_IDS[1],
            localId: 1,
            remoteId: 'remote-list-id-1',
            name: 'test shared list',
            hasRemoteAnnotationsToLoad: false,
            description: 'test list description 1',
            creator: USER_1,
            order: 1,
            pathLocalIds: [],
            pathUnifiedIds: [],
            parentLocalId: null,
            parentUnifiedId: null,
            unifiedAnnotationIds: [
                ANNOTATION_IDS[0],
                ANNOTATION_IDS[2],
                ANNOTATION_IDS[3],
            ],
        },
        {
            type: 'user-list',
            unifiedId: LIST_IDS[2],
            remoteId: 'remote-list-id-2',
            name: 'test followed list',
            hasRemoteAnnotationsToLoad: false,
            creator: USER_2,
            order: 2,
            pathLocalIds: [],
            pathUnifiedIds: [],
            parentLocalId: null,
            parentUnifiedId: null,
            unifiedAnnotationIds: [ANNOTATION_IDS[3]],
        },
        {
            type: 'page-link',
            unifiedId: LIST_IDS[3],
            localId: 2,
            remoteId: 'remote-list-id-3',
            sharedListEntryId: 'shared-list-entry-id-a',
            name: 'test joined page link list',
            normalizedPageUrl: NORMALIZED_PAGE_URL_2,
            hasRemoteAnnotationsToLoad: true,
            creator: USER_2,
            order: 3,
            pathLocalIds: [],
            pathUnifiedIds: [],
            parentLocalId: null,
            parentUnifiedId: null,
            unifiedAnnotationIds: [ANNOTATION_IDS[3]],
        },
    ]
}
