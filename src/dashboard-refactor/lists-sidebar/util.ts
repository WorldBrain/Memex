import type { RootState } from './types'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'

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

export const shareListAndAllEntries = (
    contentShareBG: ContentSharingInterface,
    listId: number,
) => async (): Promise<{ listId: string }> => {
    const { remoteListId } = await contentShareBG.shareList({ listId })

    return { listId: remoteListId }
}
