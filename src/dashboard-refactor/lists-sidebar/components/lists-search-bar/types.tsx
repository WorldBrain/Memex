import { ListSource, TextPart } from 'src/dashboard-refactor/types'

interface ListsSearchArrayObject {
    source: ListSource
    id: string
    name: string
}

export interface ListsSearchables {
    sources: ListSource[]
    lists: ListsSearchArrayObject[]
}

interface ListsSearchResultListItem {
    listId: string
    textPartArray: TextPart[]
}

export interface ListsSearchResult {
    listSource: ListSource
    resultsList: ListsSearchResultListItem
}
