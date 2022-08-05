import type { RootState } from './types'

export type ListsState = Pick<
    RootState,
    'listData' | 'localLists' | 'followedLists'
>

export const filterListsByQuery = (
    query: string,
    { listData, localLists, followedLists }: ListsState,
): {
    localListIds: number[]
    followedListIds: number[]
} => {
    const normalizedQuery = query.toLocaleLowerCase()
    const filterBySearchStr = (listId: number) =>
        listData[listId].name.toLocaleLowerCase().includes(normalizedQuery)

    return {
        localListIds: localLists.allListIds.filter(filterBySearchStr),
        followedListIds: followedLists.allListIds.filter(filterBySearchStr),
    }
}
