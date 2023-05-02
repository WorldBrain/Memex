import type { UnifiedList } from 'src/annotations/cache/types'

export const filterListsByQuery = (
    query: string,
    lists: Pick<UnifiedList, 'name' | 'unifiedId'>[],
) => {
    const normalizedQuery = query.toLocaleLowerCase()
    return lists.filter((list) =>
        list.name.toLocaleLowerCase().includes(normalizedQuery),
    )
}
