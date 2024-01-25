import type { UnifiedList } from 'src/annotations/cache/types'

export const filterListsByQuery = <
    T extends Pick<UnifiedList, 'name' | 'unifiedId'>
>(
    query: string,
    lists: T[],
): T[] => {
    const normalizedQuery = query.toLocaleLowerCase()
    return lists.filter(
        (list) =>
            list.name != null &&
            list.name.toLocaleLowerCase().includes(normalizedQuery),
    )
}
