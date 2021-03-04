import { RootState } from './types'

export const isListNameUnique = (
    name: string,
    { listData, localLists }: RootState,
    args: { listIdToSkip?: number } = {},
): boolean =>
    localLists.allListIds.reduce((acc, listId) => {
        if (listId === args.listIdToSkip) {
            return acc
        }

        return acc && listData[listId].name !== name
    }, true)

export const filterListsByQuery = (
    query: string,
    { listData, localLists, followedLists }: RootState,
): {
    localListIds: number[]
    followedListIds: number[]
} => {
    const filterBySearchStr = (listId) => listData[listId].name.includes(query)

    return {
        localListIds: localLists.allListIds.filter(filterBySearchStr),
        followedListIds: followedLists.allListIds.filter(filterBySearchStr),
    }
}
