import type { Annotation, AnnotListEntry } from 'src/annotations/types'
import type {
    ListDescription,
    PageListEntry,
} from 'src/custom-lists/background/types'
import type {
    SharedAnnotation,
    SharedAnnotationListEntry,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { UserPublicDetails } from '@worldbrain/memex-common/lib/user-management/types'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import type { PageList } from 'src/custom-lists/background/types'
import type {
    SharedListMetadata,
    SharedAnnotationMetadata,
    AnnotationPrivacyLevel,
} from 'src/content-sharing/background/types'
import {
    Anchor,
    AnnotationPrivacyLevels,
} from '@worldbrain/memex-common/lib/annotations/types'
import type {
    FollowedList,
    FollowedListEntry,
} from 'src/page-activity-indicator/background/types'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'

export const COMMENT_1 = 'This is a test comment'
export const TAB_URL_1 = 'https://test.com'
export const TAB_URL_2 = 'https://test.com/test'
export const TAB_TITLE_1 = 'Testing Site'
export const TAB_TITLE_2 = 'Better Testing Site'

export const ANNOT_1: Annotation = {
    url: normalizeUrl(TAB_URL_1) + '/#123',
    pageUrl: normalizeUrl(TAB_URL_1),
    pageTitle: TAB_TITLE_1,
    comment: COMMENT_1,
    lastEdited: new Date('2020-01-01'),
    createdWhen: new Date('2020-01-01'),
    tags: [],
    lists: [],
}

export const ANNOT_2: Annotation = {
    url: normalizeUrl(TAB_URL_1) + '/#124',
    pageUrl: normalizeUrl(TAB_URL_1),
    pageTitle: TAB_TITLE_2,
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
    url: normalizeUrl(TAB_URL_1) + '/#125',
    pageUrl: normalizeUrl(TAB_URL_1),
    pageTitle: TAB_TITLE_2 + ' next',
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
    url: normalizeUrl(TAB_URL_1) + '/#126',
    pageUrl: normalizeUrl(TAB_URL_1),
    pageTitle: TAB_TITLE_2 + ' next 2.0',
    body: 'yet another test highlight',
    lastEdited: new Date('2022-05-04'),
    createdWhen: new Date('2022-05-04'),
    selector: {
        descriptor: { content: [{ type: 'TextPositionSelector', start: 1 }] },
    } as any,
    tags: [],
    lists: [],
}

export const ANNOT_5: Annotation = {
    url: normalizeUrl(TAB_URL_2) + '/#123',
    pageUrl: normalizeUrl(TAB_URL_2),
    pageTitle: 'another page',
    body: 'a test highlight on another page',
    lastEdited: new Date('2022-12-20'),
    createdWhen: new Date('2022-12-20'),
    selector: {
        descriptor: { content: [{ type: 'TextPositionSelector', start: 15 }] },
    } as any,
    tags: [],
    lists: [],
}

export const LOCAL_ANNOTATIONS = [ANNOT_1, ANNOT_2, ANNOT_3, ANNOT_4, ANNOT_5]

export const ANNOT_METADATA: SharedAnnotationMetadata[] = [
    {
        localId: ANNOT_2.url,
        remoteId: 'shared-annot-2',
        excludeFromLists: false,
    },
    {
        localId: ANNOT_3.url,
        remoteId: 'shared-annot-3',
        excludeFromLists: false,
    },
    {
        localId: ANNOT_4.url,
        remoteId: 'shared-annot-4',
        excludeFromLists: true,
    },
]

export const ANNOT_PRIVACY_LVLS: AnnotationPrivacyLevel[] = [
    {
        annotation: ANNOT_1.url,
        privacyLevel: AnnotationPrivacyLevels.PROTECTED,
        createdWhen: new Date('2022-12-20'),
    },
    {
        annotation: ANNOT_2.url,
        privacyLevel: AnnotationPrivacyLevels.SHARED,
        createdWhen: new Date('2022-12-20'),
    },
    {
        annotation: ANNOT_3.url,
        privacyLevel: AnnotationPrivacyLevels.SHARED_PROTECTED,
        createdWhen: new Date('2022-12-20'),
    },
    {
        annotation: ANNOT_4.url,
        privacyLevel: AnnotationPrivacyLevels.PROTECTED,
        createdWhen: new Date('2022-12-20'),
    },
    {
        annotation: ANNOT_5.url,
        privacyLevel: AnnotationPrivacyLevels.PRIVATE,
        createdWhen: new Date('2022-12-20'),
    },
]

export const CREATOR_1: UserReference = {
    type: 'user-reference',
    id: TEST_USER.id,
}

export const CREATOR_2: UserReference = {
    type: 'user-reference',
    id: 'test-user-2@test.com',
}

export const LOCAL_LISTS: PageList[] = [
    {
        id: 1,
        name: 'List 1 - remote shared list',
        isNestable: true,
        isDeletable: true,
        createdAt: new Date('2021-01-19'),
    },
    {
        id: 2,
        name: 'List 2 - remote shared list',
        isNestable: true,
        isDeletable: true,
        createdAt: new Date('2021-01-18'),
    },
    {
        id: 3,
        name: 'List 3 - remote joined list',
        isNestable: true,
        isDeletable: true,
        createdAt: new Date('2021-01-17'),
    },
    {
        id: 4,
        name: 'List 4',
        isNestable: true,
        isDeletable: true,
        createdAt: new Date('2021-01-16'),
    },
    {
        id: 5,
        name: 'List 5',
        isNestable: true,
        isDeletable: true,
        createdAt: new Date('2021-01-15'),
    },
    {
        id: 6,
        name: 'List 6 - not in suggestions',
        isNestable: true,
        isDeletable: true,
        createdAt: new Date('2022-05-27'),
    },
]

export const LIST_DESCRIPTIONS: ListDescription[] = [
    { listId: LOCAL_LISTS[0].id, description: 'hey this is a  description' },
    {
        listId: LOCAL_LISTS[3].id,
        description: 'hey this is yet another description',
    },
]

export const PAGES = [
    {
        url: normalizeUrl(TAB_URL_1),
        fullUrl: TAB_URL_1,
        domain: 'test.com',
        hostname: 'test.com',
        fullTitle: TAB_TITLE_1,
        text: 'some page text',
    },
    {
        url: normalizeUrl(TAB_URL_2),
        fullUrl: TAB_URL_2,
        domain: 'test.com',
        hostname: 'test.com',
        fullTitle: TAB_TITLE_2,
        text: 'some different text',
    },
]

export const PAGE_LIST_ENTRIES: PageListEntry[] = [
    {
        listId: LOCAL_LISTS[0].id,
        pageUrl: PAGES[0].url,
        fullUrl: PAGES[0].fullUrl,
        createdAt: new Date('2022-12-20'),
    },
    {
        listId: LOCAL_LISTS[0].id,
        pageUrl: PAGES[1].url,
        fullUrl: PAGES[1].fullUrl,
        createdAt: new Date('2022-12-20'),
    },
    {
        listId: LOCAL_LISTS[3].id,
        pageUrl: PAGES[0].url,
        fullUrl: PAGES[0].fullUrl,
        createdAt: new Date('2022-12-20'),
    },
]

export const ANNOT_LIST_ENTRIES: AnnotListEntry[] = [
    {
        url: ANNOT_1.url,
        listId: LOCAL_LISTS[0].id,
    },
    {
        url: ANNOT_1.url,
        listId: LOCAL_LISTS[1].id,
    },
    {
        url: ANNOT_3.url,
        listId: LOCAL_LISTS[3].id,
    },
    {
        url: ANNOT_5.url,
        listId: LOCAL_LISTS[3].id,
    },
]

export const SHARED_LIST_IDS = [
    'remote-list-id-1',
    'remote-list-id-2',
    'remote-list-id-3',
    'remote-list-id-4',
]

export const TEST_LIST_METADATA: SharedListMetadata[] = [
    {
        localId: LOCAL_LISTS[0].id,
        remoteId: SHARED_LIST_IDS[0],
    },
    {
        localId: LOCAL_LISTS[1].id,
        remoteId: SHARED_LIST_IDS[1],
    },
    {
        localId: LOCAL_LISTS[2].id,
        remoteId: SHARED_LIST_IDS[2],
    },
]

export const SHARED_ANNOTATIONS: Array<
    SharedAnnotation & { id: AutoPk; creator: AutoPk; selector?: Anchor }
> = [
    {
        id: '1',
        normalizedPageUrl: normalizeUrl(TAB_URL_2),
        creator: CREATOR_2.id,
        body: 'test highlight 1',
        createdWhen: 11111,
        updatedWhen: 11111,
        uploadedWhen: 11111,
        selector: {
            descriptor: {
                content: [{ type: 'TextPositionSelector', start: 0 }],
            },
        } as any,
    },
    {
        id: '2',
        normalizedPageUrl: normalizeUrl(TAB_URL_2),
        creator: CREATOR_2.id,
        body: 'test highlight 2',
        comment: 'test comment 1',
        createdWhen: 11111,
        updatedWhen: 11111,
        uploadedWhen: 11111,
        selector: {
            descriptor: {
                content: [{ type: 'TextPositionSelector', start: 0 }],
            },
        } as any,
    },
    {
        id: '3',
        creator: CREATOR_2.id,
        normalizedPageUrl: normalizeUrl(TAB_URL_1),
        comment: 'test comment 3',
        createdWhen: 11111,
        updatedWhen: 11111,
        uploadedWhen: 11111,
    },
    {
        id: '4',
        creator: CREATOR_2.id,
        normalizedPageUrl: normalizeUrl(TAB_URL_1),
        comment: ANNOT_3.comment,
        createdWhen: ANNOT_3.createdWhen.getTime(),
        updatedWhen: ANNOT_3.lastEdited.getTime(),
        uploadedWhen: 11111,
    },
    {
        id: '5',
        creator: CREATOR_1.id,
        normalizedPageUrl: normalizeUrl(TAB_URL_1),
        comment: ANNOT_4.comment,
        createdWhen: ANNOT_4.createdWhen.getTime(),
        updatedWhen: ANNOT_4.lastEdited.getTime(),
        uploadedWhen: 11111,
    },
]

export const FOLLOWED_LISTS: FollowedList[] = [
    {
        sharedList: SHARED_LIST_IDS[0],
        creator: CREATOR_1.id,
        name: LOCAL_LISTS[0].name,
        lastSync: null,
    },
    {
        sharedList: SHARED_LIST_IDS[1],
        creator: CREATOR_1.id,
        name: LOCAL_LISTS[1].name,
        lastSync: new Date('2022-12-22').getTime(),
    },
    {
        sharedList: SHARED_LIST_IDS[2],
        creator: CREATOR_2.id,
        name: LOCAL_LISTS[2].name,
        lastSync: null,
    },
    {
        sharedList: SHARED_LIST_IDS[3],
        creator: CREATOR_2.id,
        name: 'test followed-only list',
        lastSync: new Date('2022-12-22').getTime(),
    },
]

export const FOLLOWED_LIST_ENTRIES: FollowedListEntry[] = [
    {
        hasAnnotations: false,
        creator: CREATOR_1.id,
        entryTitle: TAB_TITLE_1,
        followedList: SHARED_LIST_IDS[0],
        normalizedPageUrl: normalizeUrl(TAB_URL_1),
        createdWhen: new Date('2022-12-22').getTime(),
        updatedWhen: new Date('2022-12-22').getTime(),
    },
    {
        hasAnnotations: true,
        creator: CREATOR_2.id,
        entryTitle: TAB_TITLE_2,
        followedList: SHARED_LIST_IDS[0],
        normalizedPageUrl: normalizeUrl(TAB_URL_2),
        createdWhen: new Date('2022-12-22').getTime(),
        updatedWhen: new Date('2022-12-22').getTime(),
    },
    {
        hasAnnotations: true,
        creator: CREATOR_2.id,
        entryTitle: TAB_TITLE_1,
        followedList: SHARED_LIST_IDS[1],
        normalizedPageUrl: normalizeUrl(TAB_URL_1),
        createdWhen: new Date('2022-12-22').getTime(),
        updatedWhen: new Date('2022-12-22').getTime(),
    },
    {
        hasAnnotations: false,
        creator: CREATOR_1.id,
        entryTitle: TAB_TITLE_2,
        followedList: SHARED_LIST_IDS[2],
        normalizedPageUrl: normalizeUrl(TAB_URL_2),
        createdWhen: new Date('2022-12-22').getTime(),
        updatedWhen: new Date('2022-12-22').getTime(),
    },
    {
        hasAnnotations: true,
        creator: CREATOR_1.id,
        entryTitle: TAB_TITLE_1,
        followedList: SHARED_LIST_IDS[3],
        normalizedPageUrl: normalizeUrl(TAB_URL_1),
        createdWhen: new Date('2022-12-22').getTime(),
        updatedWhen: new Date('2022-12-22').getTime(),
    },
]

export const SHARED_ANNOTATION_LIST_ENTRIES: Array<
    SharedAnnotationListEntry & {
        id: AutoPk
        creator: AutoPk
        sharedList: AutoPk
        sharedAnnotation: AutoPk
    }
> = [
    {
        id: '1',
        creator: CREATOR_2.id,
        sharedList: SHARED_LIST_IDS[0],
        normalizedPageUrl: normalizeUrl(TAB_URL_2),
        sharedAnnotation: SHARED_ANNOTATIONS[0].id,
        createdWhen: new Date('2022-12-22').getTime(),
        updatedWhen: new Date('2022-12-22').getTime(),
        uploadedWhen: new Date('2022-12-22').getTime(),
    },
    {
        id: '2',
        creator: CREATOR_2.id,
        sharedList: SHARED_LIST_IDS[0],
        normalizedPageUrl: normalizeUrl(TAB_URL_2),
        sharedAnnotation: SHARED_ANNOTATIONS[1].id,
        createdWhen: new Date('2022-12-22').getTime(),
        updatedWhen: new Date('2022-12-22').getTime(),
        uploadedWhen: new Date('2022-12-22').getTime(),
    },
    {
        id: '3',
        creator: CREATOR_2.id,
        sharedList: SHARED_LIST_IDS[1],
        normalizedPageUrl: normalizeUrl(TAB_URL_1),
        sharedAnnotation: SHARED_ANNOTATIONS[2].id,
        createdWhen: new Date('2022-12-22').getTime(),
        updatedWhen: new Date('2022-12-22').getTime(),
        uploadedWhen: new Date('2022-12-22').getTime(),
    },
    {
        id: '4',
        creator: CREATOR_1.id,
        sharedList: SHARED_LIST_IDS[3],
        normalizedPageUrl: normalizeUrl(TAB_URL_1),
        sharedAnnotation: SHARED_ANNOTATIONS[3].id,
        createdWhen: new Date('2022-12-22').getTime(),
        updatedWhen: new Date('2022-12-22').getTime(),
        uploadedWhen: new Date('2022-12-22').getTime(),
    },
    {
        id: '5',
        creator: CREATOR_1.id,
        sharedList: SHARED_LIST_IDS[3],
        normalizedPageUrl: normalizeUrl(TAB_URL_1),
        sharedAnnotation: SHARED_ANNOTATIONS[4].id,
        createdWhen: new Date('2022-12-22').getTime(),
        updatedWhen: new Date('2022-12-22').getTime(),
        uploadedWhen: new Date('2022-12-22').getTime(),
    },
]
