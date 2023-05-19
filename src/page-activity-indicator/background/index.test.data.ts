import type {
    SharedAnnotationListEntry,
    SharedList,
    SharedListEntry,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import type { ActivityFollow } from '@worldbrain/memex-common/lib/activity-follows/storage/types'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'

export const userReferenceA: UserReference = {
    type: 'user-reference',
    id: TEST_USER.id,
}
export const userReferenceB: UserReference = { type: 'user-reference', id: 123 }
export const userReferenceC: UserReference = { type: 'user-reference', id: 124 }

export const users: UserReference[] = [
    userReferenceA,
    userReferenceB,
    userReferenceC,
]

export const sharedLists: Array<
    SharedList & { id: AutoPk; creator: AutoPk }
> = [
    {
        id: 1,
        creator: users[0].id,
        title: 'test a',
        createdWhen: 1,
        updatedWhen: 1,
    },
    {
        id: 2,
        creator: users[0].id,
        title: 'test b',
        createdWhen: 2,
        updatedWhen: 2,
    },
    {
        id: 3,
        creator: users[1].id,
        title: 'test c',
        description: 'great list',
        createdWhen: 3,
        updatedWhen: 3,
    },
    {
        id: 4,
        creator: users[2].id,
        title: 'test discord channel a',
        createdWhen: 4,
        updatedWhen: 4,
        platform: 'discord',
    },
]

export const listEntries: {
    [sharedListId: number]: Array<
        SharedListEntry & { id: AutoPk; creator: AutoPk }
    >
} = {
    [sharedLists[0].id]: [
        {
            id: 'shared-list-entry-id-1',
            creator: users[0].id,
            normalizedUrl: 'test.com/a',
            originalUrl: 'https://test.com/a',
            createdWhen: 1,
            updatedWhen: 1,
        },
        {
            id: 'shared-list-entry-id-2',
            creator: users[1].id,
            normalizedUrl: 'test.com/b',
            originalUrl: 'https://test.com/b',
            createdWhen: 1,
            updatedWhen: 1,
        },
    ],
    [sharedLists[1].id]: [
        {
            id: 'shared-list-entry-id-3',
            creator: users[0].id,
            normalizedUrl: 'test.com/a',
            originalUrl: 'https://test.com/a',
            createdWhen: 1,
            updatedWhen: 1,
        },
        {
            id: 'shared-list-entry-id-4',
            creator: users[0].id,
            normalizedUrl: 'test.com/b',
            originalUrl: 'https://test.com/b',
            createdWhen: 1,
            updatedWhen: 1,
        },
    ],
    [sharedLists[2].id]: [
        {
            id: 'shared-list-entry-id-5',
            creator: users[0].id,
            normalizedUrl: 'test.com/a',
            originalUrl: 'https://test.com/a',
            createdWhen: 1,
            updatedWhen: 1,
        },
    ],
    [sharedLists[3].id]: [
        {
            id: 'shared-list-entry-id-6',
            creator: users[0].id,
            normalizedUrl: 'test.com/a',
            originalUrl: 'https://test.com/a',
            createdWhen: 1,
            updatedWhen: 1,
        },
    ],
}

export const annotationListEntries: {
    [sharedList: number]: Array<
        SharedAnnotationListEntry & {
            sharedList: AutoPk
            creator: AutoPk
        }
    >
} = {
    [sharedLists[0].id]: [
        {
            creator: users[0].id,
            sharedList: sharedLists[0].id,
            normalizedPageUrl: 'test.com/a',
            updatedWhen: 1,
            createdWhen: 1,
            uploadedWhen: 1,
        },
        {
            creator: users[1].id,
            sharedList: sharedLists[0].id,
            normalizedPageUrl: 'test.com/a',
            updatedWhen: 1,
            createdWhen: 1,
            uploadedWhen: 1,
        },
    ],
}

export const activityFollows: Array<ActivityFollow & { user: AutoPk }> = [
    {
        collection: 'sharedList',
        objectId: sharedLists[0].id.toString(),
        user: users[0].id,
        createdWhen: 1,
    },
    {
        collection: 'sharedList',
        objectId: sharedLists[1].id.toString(),
        user: users[0].id,
        createdWhen: 1,
    },
    {
        collection: 'sharedList',
        objectId: sharedLists[3].id.toString(),
        user: users[0].id,
        createdWhen: 1,
    },
]
