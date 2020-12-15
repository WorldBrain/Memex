import { ListsSearchables, ListsSearchResult } from './types'

export const searchLists = (
    searchStr: string,
    searchData: ListsSearchables,
): ListsSearchResult[] => {
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
        const sourceItemArr = arr[arr.length - 1]
        lists.map((list) => {
            const { name, id } = list
            const match = name.startsWith(searchStr)
            if (match) {
                sourceItemArr.push({
                    listId: id,
                    textPartArray: [],
                })
                // isolate textPartArray for list with matching name and populate
                const textPartArray = sourceItemArr[sourceItemArr.length - 1]
                textPartArray.push({
                    text: searchStr,
                    match: true,
                })
                // add non-matched string portion to array if not perfect match
                if (!(name.length === searchStr.length)) {
                    textPartArray.push({
                        text: name.slice(searchStr.length),
                        match: false,
                    })
                }
            }
        })
        // 3. Sort inner arrays with perfect matches first
        sourceItemArr.resultsList.sort((a, b) => {
            const aSort = a.textPartArray.length % 2
            const bSort = b.textPartArray.length % 2
            return bSort - aSort
        })
        return arr
    }, [])
}
