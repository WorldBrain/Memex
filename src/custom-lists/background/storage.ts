import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'
import {
    COLLECTION_DEFINITIONS,
    COLLECTION_NAMES,
} from '@worldbrain/memex-storage/lib/lists/constants'
import { MOBILE_LIST_NAME } from '@worldbrain/memex-storage/lib/mobile-app/features/meta-picker/constants'

import { SuggestPlugin } from 'src/search/plugins'
import { SuggestResult } from 'src/search/types'
import { PageList, PageListEntry } from './types'

export default class CustomListStorage extends StorageModule {
    static CUSTOM_LISTS_COLL = COLLECTION_NAMES.list
    static LIST_ENTRIES_COLL = COLLECTION_NAMES.listEntry

    getConfig = (): StorageModuleConfig => ({
        collections: {
            ...COLLECTION_DEFINITIONS,
        },
        operations: {
            createList: {
                collection: CustomListStorage.CUSTOM_LISTS_COLL,
                operation: 'createObject',
            },
            createListEntry: {
                collection: CustomListStorage.LIST_ENTRIES_COLL,
                operation: 'createObject',
            },
            findListsIncluding: {
                collection: CustomListStorage.CUSTOM_LISTS_COLL,
                operation: 'findObjects',
                args: {
                    id: { $in: '$includedIds:array' },
                },
            },
            findListsExcluding: {
                collection: CustomListStorage.CUSTOM_LISTS_COLL,
                operation: 'findObjects',
                args: [
                    {
                        id: { $nin: '$excludedIds:array' },
                    },
                    {
                        limit: '$limit:int',
                        skip: '$skip:int',
                    },
                ],
            },
            findListById: {
                collection: CustomListStorage.CUSTOM_LISTS_COLL,
                operation: 'findObject',
                args: { id: '$id:pk' },
            },
            findListEntriesByListId: {
                collection: CustomListStorage.LIST_ENTRIES_COLL,
                operation: 'findObjects',
                args: { listId: '$listId:int' },
            },
            findListEntriesByUrl: {
                collection: CustomListStorage.LIST_ENTRIES_COLL,
                operation: 'findObjects',
                args: { pageUrl: '$url:string' },
            },
            findListEntriesByLists: {
                collection: CustomListStorage.LIST_ENTRIES_COLL,
                operation: 'findObjects',
                args: {
                    listId: { $in: '$listIds:array' },
                    pageUrl: '$url:string',
                },
            },
            findListByNameIgnoreCase: {
                collection: CustomListStorage.CUSTOM_LISTS_COLL,
                operation: 'findObject',
                args: [{ name: '$name:string' }, { ignoreCase: ['name'] }],
            },
            findListsByNames: {
                collection: CustomListStorage.CUSTOM_LISTS_COLL,
                operation: 'findObjects',
                args: { name: { $in: '$name:string[]' } },
            },
            updateListName: {
                collection: CustomListStorage.CUSTOM_LISTS_COLL,
                operation: 'updateObject',
                args: [
                    {
                        id: '$id:pk',
                    },
                    {
                        name: '$name:string',
                        // updatedAt: '$updatedAt:any',
                    },
                ],
            },
            deleteList: {
                collection: CustomListStorage.CUSTOM_LISTS_COLL,
                operation: 'deleteObject',
                args: { id: '$id:pk' },
            },
            deleteListEntriesByListId: {
                collection: CustomListStorage.LIST_ENTRIES_COLL,
                operation: 'deleteObjects',
                args: { listId: '$listId:pk' },
            },
            deleteListEntriesById: {
                collection: CustomListStorage.LIST_ENTRIES_COLL,
                operation: 'deleteObjects',
                args: { listId: '$listId:pk', pageUrl: '$pageUrl:string' },
            },
            [SuggestPlugin.SUGGEST_OBJS_OP_ID]: {
                operation: SuggestPlugin.SUGGEST_OBJS_OP_ID,
                args: {
                    collection: '$collection:string',
                    query: '$query:string',
                    options: '$options:any',
                },
            },
        },
    })

    private prepareList(
        list: PageList,
        pages: string[] = [],
        active: boolean = false,
    ): PageList {
        delete list['_name_terms']

        return {
            ...list,
            pages,
            active,
        }
    }

    async createMobileListIfAbsent({ id }: { id: number }): Promise<string> {
        const foundMobileLists = await this.operation('findListsByNames', {
            name: [MOBILE_LIST_NAME],
        })
        if (foundMobileLists.length) {
            return foundMobileLists[0].id
        }

        return (
            await this.operation('createList', {
                id,
                name: MOBILE_LIST_NAME,
                isDeletable: false,
                isNestable: false,
                createdAt: new Date(),
            })
        ).object.id
    }

    private filterMobileList = (lists: any[]): any[] =>
        lists.filter((list) => list.name !== MOBILE_LIST_NAME)

    async fetchAllLists({
        excludedIds = [],
        limit,
        skip,
        skipMobileList,
    }: {
        excludedIds?: string[]
        limit: number
        skip: number
        skipMobileList?: boolean
    }) {
        const lists = await this.operation('findListsExcluding', {
            excludedIds,
            limit,
            skip,
        })

        const prepared = lists.map((list) => this.prepareList(list))

        if (skipMobileList) {
            return this.filterMobileList(prepared)
        }

        return prepared
    }

    async fetchListById(id: number): Promise<PageList | null> {
        return this.operation('findListById', { id })
    }

    async fetchListWithPagesById(id: number) {
        const list = await this.fetchListById(id)

        if (!list) {
            return null
        }

        const pages = await this.fetchListPagesById({ listId: list.id })

        return this.prepareList(
            list,
            pages.map((p) => p.fullUrl),
            pages.length > 0,
        )
    }

    async fetchListPagesById({
        listId,
    }: {
        listId: number
    }): Promise<PageListEntry[]> {
        return this.operation('findListEntriesByListId', { listId })
    }

    async fetchListPagesByUrl({ url }: { url: string }) {
        const pages = await this.operation('findListEntriesByUrl', { url })

        const entriesByListId = new Map<number, any[]>()
        const listIds = new Set<string>()

        pages.forEach((page) => {
            listIds.add(page.listId)
            const current = entriesByListId.get(page.listId) || []
            entriesByListId.set(page.listId, [...current, page.fullUrl])
        })

        const lists: PageList[] = this.filterMobileList(
            await this.operation('findListsIncluding', {
                includedIds: [...listIds],
            }),
        )

        return lists.map((list) => {
            const entries = entriesByListId.get(list.id)
            return this.prepareList(list, entries, entries != null)
        })
    }

    async insertCustomList({
        id,
        name,
        isDeletable = true,
        isNestable = true,
    }: {
        id: number
        name: string
        isDeletable?: boolean
        isNestable?: boolean
    }) {
        const { object } = await this.operation('createList', {
            id,
            name,
            isDeletable,
            isNestable,
            createdAt: new Date(),
        })

        return object.id
    }

    async updateListName({
        id,
        name,
        updatedAt = new Date(),
    }: {
        id: number
        name: string
        updatedAt?: Date
    }) {
        return this.operation('updateListName', {
            id,
            name,
            // updatedAt,
        })
    }

    async removeList({ id }: { id: number }) {
        const list = await this.operation('deleteList', { id })
        const pages = await this.operation('deleteListEntriesByListId', {
            listId: id,
        })
        return { list, pages }
    }

    async insertPageToList({
        listId,
        pageUrl,
        fullUrl,
    }: {
        listId: number
        pageUrl: string
        fullUrl: string
    }) {
        const idExists = Boolean(await this.fetchListById(listId))

        if (idExists) {
            return this.operation('createListEntry', {
                listId,
                pageUrl,
                fullUrl,
                createdAt: new Date(),
            })
        }
    }

    async removePageFromList({
        listId,
        pageUrl,
    }: {
        listId: number
        pageUrl: string
    }) {
        return this.operation('deleteListEntriesById', { listId, pageUrl })
    }

    async suggestLists({
        query,
        limit = 5,
    }: {
        query: string
        limit?: number
    }): Promise<SuggestResult<string, number>> {
        const suggestions = await this.operation(
            SuggestPlugin.SUGGEST_OBJS_OP_ID,
            {
                collection: CustomListStorage.CUSTOM_LISTS_COLL,
                query: { name: query },
                options: {
                    includePks: true,
                    ignoreCase: ['name'],
                    limit,
                },
            },
        )

        return suggestions
    }

    async fetchListNameSuggestions({
        name,
        url,
    }: {
        name: string
        url: string
    }) {
        const suggestions = await this.suggestLists({ query: name })
        const listIds = suggestions.map(({ pk }) => pk)

        const lists: PageList[] = suggestions.map(({ pk, suggestion }) => ({
            id: pk,
            name: suggestion,
        }))

        const pageEntries = await this.operation('findListEntriesByLists', {
            listIds,
            url,
        })

        const entriesByListId = new Map<number, any[]>()

        pageEntries.forEach((page) => {
            const current = entriesByListId.get(page.listId) || []
            entriesByListId.set(page.listId, [...current, page.fullUrl])
        })

        return this.filterMobileList(
            lists.map((list) => {
                const entries = entriesByListId.get(list.id)
                return this.prepareList(list, entries, entries != null)
            }),
        )
    }

    async fetchListIgnoreCase({ name }: { name: string }) {
        return this.operation('findListByNameIgnoreCase', { name })
    }
}
