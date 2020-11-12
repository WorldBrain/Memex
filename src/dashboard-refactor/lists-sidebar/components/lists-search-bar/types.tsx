import { ListSource } from 'src/dashboard-refactor/types'

interface ListsSearchArrayObject {
    source: ListSource
    id: string
    name: string
}

export interface ListsSearchables {
    sources: Array<ListSource>
    lists: Array<ListsSearchArrayObject>
}

interface ListsSearchResultItem {
    listId: Number
    isPerfectMatch: boolean
    matchStartIndex: Number
    matchLength: Number
}

export interface ListsSearchResults {
    listSource: ListSource
    resultsList: Array<ListsSearchResultItem>
}
