import type { SpaceDisplayEntry } from './logic'

export const TEST_LISTS = [
    {
        id: 1,
        name: 'List 1',
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
]

export const derivePickerEntries = (
    lists: typeof TEST_LISTS,
): SpaceDisplayEntry[] =>
    lists.map((list) => ({
        name: list.name,
        localId: list.id,
        focused: false,
        createdAt: list.createdAt.getTime(),
        remoteId:
            TEST_LIST_METADATA.find((meta) => meta.localId === list.id)
                ?.remoteId ?? null,
    }))
