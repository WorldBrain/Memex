import cloneDeep from 'lodash/cloneDeep'
import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'
import {
    COLLECTION_DEFINITIONS,
    COLLECTION_NAMES,
    SPECIAL_LIST_NAMES,
    SPECIAL_LIST_IDS,
} from '@worldbrain/memex-storage/lib/lists/constants'

import { SuggestPlugin } from 'src/search/plugins'
import { SuggestResult } from 'src/search/types'
import { PageList, PageListEntry } from './types'
import { STORAGE_VERSIONS } from 'src/storage/constants'

export default class CustomListStorage extends StorageModule {
    static CUSTOM_LISTS_COLL = COLLECTION_NAMES.list
    static LIST_ENTRIES_COLL = COLLECTION_NAMES.listEntry

    static filterOutSpecialListEntries = (entry: { listId: number }) =>
        !Object.values<number>(SPECIAL_LIST_IDS).includes(entry.listId)
    static filterOutSpecialLists = (list: { name: string }) =>
        !Object.values<string>(SPECIAL_LIST_NAMES).includes(list.name)

    getConfig(): StorageModuleConfig {
        const collections = cloneDeep(
            COLLECTION_DEFINITIONS,
        ) as typeof COLLECTION_DEFINITIONS
        collections[COLLECTION_NAMES.listDescription].version =
            STORAGE_VERSIONS[20].version
        collections[COLLECTION_NAMES.listEntryDescription].version =
            STORAGE_VERSIONS[20].version

        return {
            collections,
            operations: {
                createList: {
                    collection: CustomListStorage.CUSTOM_LISTS_COLL,
                    operation: 'createObject',
                },
                createListEntry: {
                    collection: CustomListStorage.LIST_ENTRIES_COLL,
                    operation: 'createObject',
                },
                countListEntries: {
                    collection: CustomListStorage.LIST_ENTRIES_COLL,
                    operation: 'countObjects',
                    args: { listId: '$listId:int' },
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
                            searchableName: '$name:string',
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
        }
    }

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

    async createInboxListIfAbsent({
        createdAt = new Date(),
    }: {
        createdAt?: Date
    }): Promise<number> {
        const foundInboxList = await this.operation(
            'findListByNameIgnoreCase',
            { name: SPECIAL_LIST_NAMES.INBOX },
        )
        if (foundInboxList) {
            return foundInboxList.id
        }

        return (
            await this.operation('createList', {
                name: SPECIAL_LIST_NAMES.INBOX,
                id: SPECIAL_LIST_IDS.INBOX,
                isDeletable: false,
                isNestable: false,
                createdAt,
            })
        ).object.id
    }

    countListEntries(listId: number): Promise<number> {
        return this.operation('countListEntries', { listId })
    }

    countInboxUnread(): Promise<number> {
        return this.countListEntries(SPECIAL_LIST_IDS.INBOX)
    }

    private filterMobileList = (lists: any[]): any[] =>
        lists.filter((list) => list.name !== SPECIAL_LIST_NAMES.MOBILE)

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

    async fetchListIdsByUrl(url: string): Promise<number[]> {
        const entries = await this.operation('findListEntriesByUrl', { url })
        return entries.map((entry) => entry.listId)
    }

    async fetchListPagesByUrl({ url }: { url: string }) {
        const pageEntries = await this.operation('findListEntriesByUrl', {
            url,
        })

        const entriesByListId = new Map<number, any[]>()
        const listIds = new Set<string>()

        pageEntries
            .filter(CustomListStorage.filterOutSpecialListEntries)
            .forEach((entry) => {
                listIds.add(entry.listId)
                const current = entriesByListId.get(entry.listId) || []
                entriesByListId.set(entry.listId, [...current, entry.fullUrl])
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
    }): Promise<number> {
        const { object } = await this.operation('createList', {
            id,
            name,
            isNestable,
            isDeletable,
            searchableName: name,
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
        createdAt = new Date(),
    }: {
        listId: number
        pageUrl: string
        fullUrl: string
        createdAt?: Date
    }) {
        const idExists = Boolean(await this.fetchListById(listId))

        if (idExists) {
            return this.operation('createListEntry', {
                listId,
                pageUrl,
                fullUrl,
                createdAt,
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
    }): Promise<PageList[]> {
        const suggestions: SuggestResult<string, number> = await this.operation(
            SuggestPlugin.SUGGEST_OBJS_OP_ID,
            {
                collection: CustomListStorage.CUSTOM_LISTS_COLL,
                query: { nameTerms: query },
                options: {
                    includePks: true,
                    limit,
                },
            },
        )

        const suggestedLists = await this.operation('findListsIncluding', {
            includedIds: suggestions.map(({ pk }) => pk),
        })

        return suggestedLists.filter(CustomListStorage.filterOutSpecialLists)
    }

    async fetchListIgnoreCase({ name }: { name: string }) {
        return this.operation('findListByNameIgnoreCase', { name })
    }
}
