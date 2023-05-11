import type { SpaceDisplayEntry } from './logic'
import type { PageList } from 'src/custom-lists/background/types'
import type {
    FollowedList,
    FollowedListEntry,
} from 'src/page-activity-indicator/background/types'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import { SharedCollectionType } from '@worldbrain/memex-common/lib/content-sharing/storage/types'

export const TAB_URL_1 = 'https://test.com'
export const TAB_URL_2 = 'https://test.com/test'
export const TAB_TITLE_1 = 'Testing Site'
export const TAB_TITLE_2 = 'Better Testing Site'

export const CREATOR_1: UserReference = {
    type: 'user-reference',
    id: TEST_USER.id,
}

export const CREATOR_2: UserReference = {
    type: 'user-reference',
    id: 'test-user-2@test.com',
}

export const TEST_LISTS: PageList[] = [
    {
        id: 1,
        name: 'List 1 test',
        isNestable: true,
        isDeletable: true,
        createdAt: new Date('2021-01-19'),
    },
    {
        id: 2,
        name: 'List 2',
        isNestable: true,
        isDeletable: true,
        createdAt: new Date('2021-01-18'),
    },
    {
        id: 3,
        name: 'List 3',
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
        name: 'List 6 diff',
        isNestable: true,
        isDeletable: true,
        createdAt: new Date('2022-05-27'),
    },
    {
        id: 7,
        name: 'Page Discussion',
        isNestable: true,
        isDeletable: true,
        type: SharedCollectionType.PageLink,
        createdAt: new Date('2023-05-10'),
    },
    {
        id: 8,
        name: 'Page Discussion',
        isNestable: true,
        isDeletable: true,
        type: SharedCollectionType.PageLink,
        createdAt: new Date('2023-05-11'),
    },
]

export const TEST_LIST_METADATA = [
    {
        localId: TEST_LISTS[0].id,
        remoteId: 'remote-id-1',
    },
    {
        localId: TEST_LISTS[1].id,
        remoteId: 'remote-id-2',
    },
    {
        localId: TEST_LISTS[2].id,
        remoteId: 'remote-id-3',
    },
    {
        localId: TEST_LISTS[6].id,
        remoteId: 'remote-id-4',
    },
    {
        localId: TEST_LISTS[7].id,
        remoteId: 'remote-id-5',
    },
]

export const FOLLOWED_LISTS: FollowedList[] = [
    {
        sharedList: TEST_LIST_METADATA[3].remoteId,
        creator: CREATOR_1.id,
        name: TEST_LISTS[6].name,
        lastSync: new Date('2023-05-11').getTime(),
        type: SharedCollectionType.PageLink,
    },
    {
        sharedList: TEST_LIST_METADATA[4].remoteId,
        creator: CREATOR_1.id,
        name: TEST_LISTS[7].name,
        lastSync: new Date('2023-05-11').getTime(),
        type: SharedCollectionType.PageLink,
    },
]

export const FOLLOWED_LIST_ENTRIES: FollowedListEntry[] = [
    {
        sharedListEntry: 'shared-list-entry-id-1',
        hasAnnotationsFromOthers: false,
        creator: CREATOR_1.id,
        entryTitle: TAB_TITLE_1,
        followedList: TEST_LIST_METADATA[3].remoteId,
        normalizedPageUrl: normalizeUrl(TAB_URL_1),
        createdWhen: new Date('2023-05-11').getTime(),
        updatedWhen: new Date('2023-05-11').getTime(),
    },
    {
        sharedListEntry: 'shared-list-entry-id-2',
        hasAnnotationsFromOthers: true,
        creator: CREATOR_2.id,
        entryTitle: TAB_TITLE_2,
        followedList: TEST_LIST_METADATA[4].remoteId,
        normalizedPageUrl: normalizeUrl(TAB_URL_2),
        createdWhen: new Date('2023-05-11').getTime(),
        updatedWhen: new Date('2023-05-11').getTime(),
    },
]

export const testListToSuggestion = (
    list: PageList,
    extra: Pick<SpaceDisplayEntry, 'unifiedId'>,
): SpaceDisplayEntry => ({
    type: 'user-list',
    unifiedId: extra.unifiedId,
    localId: list.id,
    name: list.name,
    remoteId:
        TEST_LIST_METADATA.find((d) => d.localId === list.id)?.remoteId ??
        undefined,
    hasRemoteAnnotationsToLoad: false,
    unifiedAnnotationIds: [],
})

export const TEST_LIST_SUGGESTIONS = TEST_LISTS.slice(0, 6).map((list, i) =>
    testListToSuggestion(list, { unifiedId: i.toString() }),
)
