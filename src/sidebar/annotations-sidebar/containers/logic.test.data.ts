import type { Annotation } from 'src/annotations/types'
import type { SharedAnnotationList } from 'src/custom-lists/background/types'
import type {
    SharedAnnotation,
    SharedAnnotationReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { UserPublicDetails } from '@worldbrain/memex-common/lib/user-management/types'
import type { PreparedThread } from '@worldbrain/memex-common/lib/content-conversations/storage/types'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'

export const PAGE_URL_1 = 'https://test.com'
export const COMMENT_1 = 'This is a test comment'
export const TAG_1 = 'tag 1'
export const TAG_2 = 'tag 2'
export const CURRENT_TAB_URL_1 = 'https://test.com'
export const CURRENT_TAB_TITLE_1 = 'Testing Site'
export const CURRENT_TAB_TITLE_2 = 'Better Testing Site'

export const ANNOT_1: Annotation = {
    url: normalizeUrl(CURRENT_TAB_URL_1) + '/#123',
    pageUrl: normalizeUrl(CURRENT_TAB_URL_1),
    pageTitle: CURRENT_TAB_TITLE_1,
    comment: COMMENT_1,
    lastEdited: new Date('2020-01-01'),
    createdWhen: new Date('2020-01-01'),
    tags: [],
    lists: [],
}

export const ANNOT_2: Annotation = {
    url: normalizeUrl(CURRENT_TAB_URL_1) + '/#124',
    pageUrl: normalizeUrl(CURRENT_TAB_URL_1),
    pageTitle: CURRENT_TAB_TITLE_2,
    body: 'test highlight',
    lastEdited: new Date('2022-04-03'),
    createdWhen: new Date('2022-04-03'),
    selector: {
        descriptor: { content: [{ type: 'TextPositionSelector', start: 0 }] },
    } as any,
    tags: [],
    lists: [],
}

export const ANNOT_3: Annotation = {
    url: normalizeUrl(CURRENT_TAB_URL_1) + '/#125',
    pageUrl: normalizeUrl(CURRENT_TAB_URL_1),
    pageTitle: CURRENT_TAB_TITLE_2 + ' next',
    body: 'another test highlight',
    lastEdited: new Date('2022-04-09'),
    createdWhen: new Date('2022-04-09'),
    selector: {
        descriptor: { content: [{ type: 'TextPositionSelector', start: 1 }] },
    } as any,
    tags: [],
    lists: [],
}

export const ANNOT_4: Annotation = {
    url: normalizeUrl(CURRENT_TAB_URL_1) + '/#126',
    pageUrl: normalizeUrl(CURRENT_TAB_URL_1),
    pageTitle: CURRENT_TAB_TITLE_2 + ' next 2.0',
    body: 'yet another test highlight',
    lastEdited: new Date('2022-05-04'),
    createdWhen: new Date('2022-05-04'),
    selector: {
        descriptor: { content: [{ type: 'TextPositionSelector', start: 1 }] },
    } as any,
    tags: [],
    lists: [],
}

export const CREATOR_1: UserPublicDetails = {
    user: { displayName: 'Tester A' },
    profile: { avatarURL: 'https://worldbrain.io/test.jpg' },
}

export const CREATOR_2: UserPublicDetails = {
    user: { displayName: TEST_USER.displayName },
    profile: { avatarURL: 'https://worldbrain.io/test2.jpg' },
}

export const LISTS_1 = [
    { id: 1, name: 'test 1' },
    { id: 2, name: 'test 2' },
    { id: 3, name: 'test 3' },
]

export const SHARED_ANNOTATIONS: Array<
    SharedAnnotation & {
        reference: SharedAnnotationReference
        creatorReference: UserReference
        creator: UserPublicDetails
    }
> = [
    {
        reference: { type: 'shared-annotation-reference', id: '1' },
        creatorReference: { type: 'user-reference', id: '123' },
        creator: CREATOR_1,
        normalizedPageUrl: 'test.com',
        body: 'test highlight 1',
        createdWhen: 11111,
        updatedWhen: 11111,
        uploadedWhen: 11111,
        selector: {} as any,
    },
    {
        reference: { type: 'shared-annotation-reference', id: '2' },
        creatorReference: { type: 'user-reference', id: '123' },
        creator: CREATOR_1,
        normalizedPageUrl: 'test.com',
        body: 'test highlight 2',
        comment: 'test comment 1',
        createdWhen: 11111,
        updatedWhen: 11111,
        uploadedWhen: 11111,
    },
    {
        reference: { type: 'shared-annotation-reference', id: '3' },
        creatorReference: { type: 'user-reference', id: '123' },
        creator: CREATOR_1,
        normalizedPageUrl: 'test.com',
        comment: 'test comment 3',
        createdWhen: 11111,
        updatedWhen: 11111,
        uploadedWhen: 11111,
    },
    {
        reference: { type: 'shared-annotation-reference', id: '4' },
        creatorReference: { type: 'user-reference', id: TEST_USER.id },
        creator: CREATOR_2,
        normalizedPageUrl: ANNOT_3.pageUrl,
        comment: ANNOT_3.comment,
        createdWhen: ANNOT_3.createdWhen.getTime(),
        updatedWhen: ANNOT_3.lastEdited.getTime(),
        uploadedWhen: 11111,
    },
    {
        reference: { type: 'shared-annotation-reference', id: '5' },
        creatorReference: { type: 'user-reference', id: TEST_USER.id },
        creator: CREATOR_2,
        normalizedPageUrl: ANNOT_4.pageUrl,
        comment: ANNOT_4.comment,
        createdWhen: ANNOT_4.createdWhen.getTime(),
        updatedWhen: ANNOT_4.lastEdited.getTime(),
        uploadedWhen: 11111,
    },
]

export const FOLLOWED_LISTS: SharedAnnotationList[] = [
    {
        id: 'test a',
        name: 'test a',
        sharedAnnotationReferences: [
            SHARED_ANNOTATIONS[0].reference,
            SHARED_ANNOTATIONS[3].reference,
        ],
    },
    {
        id: 'test b',
        name: 'test b',
        sharedAnnotationReferences: [
            SHARED_ANNOTATIONS[0].reference,
            SHARED_ANNOTATIONS[1].reference,
        ],
    },
    {
        id: 'test c',
        name: 'test c',
        sharedAnnotationReferences: [
            SHARED_ANNOTATIONS[0].reference,
            SHARED_ANNOTATIONS[2].reference,
            SHARED_ANNOTATIONS[3].reference,
        ],
    },
    {
        id: 'test d',
        name: 'test d',
        sharedAnnotationReferences: [],
    },
]

export const ANNOTATION_THREADS: PreparedThread[] = [
    {
        sharedAnnotation: SHARED_ANNOTATIONS[0].reference,
        sharedList: {
            id: FOLLOWED_LISTS[0].id,
            type: 'shared-list-reference',
        },
        thread: {
            normalizedPageUrl: SHARED_ANNOTATIONS[0].normalizedPageUrl,
            updatedWhen: 1231231,
        },
    },
    {
        sharedAnnotation: SHARED_ANNOTATIONS[3].reference,
        sharedList: {
            id: FOLLOWED_LISTS[0].id,
            type: 'shared-list-reference',
        },
        thread: {
            normalizedPageUrl: SHARED_ANNOTATIONS[3].normalizedPageUrl,
            updatedWhen: 1231231,
        },
    },
]
