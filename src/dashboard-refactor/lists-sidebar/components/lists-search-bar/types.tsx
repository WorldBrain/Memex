import { ListSource, SearchResultTextPart } from 'src/dashboard-refactor/types'

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
    textPartArray: SearchResultTextPart[]
}

export interface ListsSearchResult {
    listSource: ListSource
    resultsList: ListsSearchResultListItem
}
