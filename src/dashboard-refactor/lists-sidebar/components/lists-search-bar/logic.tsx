import { ListSource } from 'src/dashboard-refactor/types'

interface ListsSearchArrayObject {
    source: ListSource
    id: string
    name: string
}

interface ListsSearchables {
    sources: Array<ListSource>
    lists: Array<ListsSearchArrayObject>
}

interface ListsSearchResultItem {
    listId: Number
    isPerfectMatch: boolean
    matchStartIndex: Number
    matchLength: Number
}

interface ListsSearchResults {
    listSource: ListSource
    resultsList: Array<ListsSearchResultItem>
}

const searchLists = (
    searchStr: string,
    searchData: ListsSearchables,
): Array<ListsSearchResults> => {
    const { sources, lists } = searchData
    // 1. Loop through sources and create an array with an object per source
    //  - This should have a listSource prop and a resultsList prop with empty
    //    array value
    return sources.reduce((arr, source) => {
        arr.push({
            listSource: source,
            resultsList: [],
        })
        // 2. For each source run through lists and run search func. If match exists
        //    then add to resultsList array
        const currentArrItem = arr[arr.length - 1]
        lists.map((list, idx) => {
            const { name, id } = list
            if (name.startsWith(searchStr))
                currentArrItem.resultsList.push({
                    listId: id,
                    isPerfectMatch: name.length === searchStr.length,
                    matchStartIdx: 0,
                    matchLength: searchStr.length,
                })
        })
        // 3. Sort inner arrays by isPerfectMatch (if refactored then also by matchStartIdx asc)
        currentArrItem.resultsList.sort((a, b) => {
            let aSort = a.isPerfect || -1
            let bSort = b.isPerfect || -1
            return bSort - aSort
        })
        return arr
    }, [])
}
