import cloneDeep from 'lodash/cloneDeep'
import {
    StorageModule,
    StorageModuleConfig,
    StorageModuleConstructorArgs,
} from '@worldbrain/storex-pattern-modules'
import {
    COLLECTION_DEFINITIONS,
    COLLECTION_NAMES,
    SPECIAL_LIST_NAMES,
    SPECIAL_LIST_IDS,
} from '@worldbrain/memex-common/lib/storage/modules/lists/constants'

import { SuggestPlugin } from 'src/search/plugins'
import type { SuggestResult } from 'src/search/types'
import type { PageList, PageListEntry, ListDescription } from './types'
import { STORAGE_VERSIONS } from 'src/storage/constants'
import { DEFAULT_TERM_SEPARATOR } from '@worldbrain/memex-stemmer/lib/constants'
import {
    trackSpaceCreate,
    trackSpaceEntryCreate,
} from '@worldbrain/memex-common/lib/analytics/events'
import { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import {
    isPkmSyncEnabled,
    sharePageWithPKM,
} from 'src/pkm-integrations/background/backend/utils'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'

export default class CustomListStorage extends StorageModule {
    static LIST_DESCRIPTIONS_COLL = COLLECTION_NAMES.listDescription
    static CUSTOM_LISTS_COLL = COLLECTION_NAMES.list
    static LIST_ENTRIES_COLL = COLLECTION_NAMES.listEntry

    static filterOutSpecialListEntries = (entry: { listId: number }) =>
        !Object.values<number>(SPECIAL_LIST_IDS).includes(entry.listId)
    static filterOutSpecialLists = (list: { name: string }) =>
        !Object.values<string>(SPECIAL_LIST_NAMES).includes(list.name)

    constructor(private options: StorageModuleConstructorArgs) {
        super(options)
    }

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
                createListDescription: {
                    collection: CustomListStorage.LIST_DESCRIPTIONS_COLL,
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
                findLists: {
                    collection: CustomListStorage.CUSTOM_LISTS_COLL,
                    operation: 'findObjects',
                    args: [
                        {},
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
                findListsByIds: {
                    collection: CustomListStorage.CUSTOM_LISTS_COLL,
                    operation: 'findObjects',
                    args: { id: { $in: '$ids:array' } },
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
                findListEntriesByUrls: {
                    collection: CustomListStorage.LIST_ENTRIES_COLL,
                    operation: 'findObjects',
                    args: {
                        listId: '$listId:number',
                        pageUrl: { $in: '$urls:string' },
                    },
                },
                findListEntriesByLists: {
                    collection: CustomListStorage.LIST_ENTRIES_COLL,
                    operation: 'findObjects',
                    args: {
                        listId: { $in: '$listIds:array' },
                        pageUrl: '$url:string',
                    },
                },
                findPageByUrl: {
                    operation: 'findObject',
                    collection: 'pages',
                    args: {
                        url: '$url:string',
                    },
                },
                findListEntry: {
                    collection: CustomListStorage.LIST_ENTRIES_COLL,
                    operation: 'findObject',
                    args: { pageUrl: '$pageUrl:string', listId: '$listId:int' },
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
                findListDescriptionByList: {
                    collection: CustomListStorage.LIST_DESCRIPTIONS_COLL,
                    operation: 'findObject',
                    args: { listId: '$listId:pk' },
                },
                findListDescriptionsByLists: {
                    collection: CustomListStorage.LIST_DESCRIPTIONS_COLL,
                    operation: 'findObjects',
                    args: { listId: { $in: '$listIds:array' } },
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
                updateListDescription: {
                    collection: CustomListStorage.LIST_DESCRIPTIONS_COLL,
                    operation: 'updateObject',
                    args: [
                        { listId: '$listId:pk' },
                        { description: '$description:string' },
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
                deleteListDescriptions: {
                    collection: CustomListStorage.LIST_DESCRIPTIONS_COLL,
                    operation: 'deleteObjects',
                    args: { listId: '$listId:pk' },
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

    async createListDescription({
        listId,
        description,
    }: {
        listId: number
        description: string
    }): Promise<void> {
        await this.operation('createListDescription', { listId, description })
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
                searchableName: SPECIAL_LIST_NAMES.INBOX,
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

    async fetchListDescriptionByList(
        listId: number,
    ): Promise<ListDescription | null> {
        return this.operation('findListDescriptionByList', { listId })
    }

    async fetchListDescriptionsByLists(
        listIds: number[],
    ): Promise<ListDescription[]> {
        return this.operation('findListDescriptionsByLists', { listIds })
    }

    async fetchAllLists({
        limit,
        skip,
        skipSpecialLists,
        includeDescriptions,
    }: {
        limit: number
        skip: number
        skipSpecialLists?: boolean
        includeDescriptions?: boolean
    }) {
        const lists: PageList[] = await this.operation('findLists', {
            limit,
            skip,
        })

        if (includeDescriptions) {
            const descriptions = await this.fetchListDescriptionsByLists(
                lists.map((list) => list.id),
            )
            const descriptionsById = descriptions.reduce(
                (acc, curr) => ({ ...acc, [curr.listId]: curr.description }),
                {},
            )
            for (const list of lists) {
                list.description = descriptionsById[list.id]
            }
        }

        const prepared = lists.map((list) => this.prepareList(list))

        if (skipSpecialLists) {
            return prepared.filter(CustomListStorage.filterOutSpecialLists)
        }

        return prepared
    }

    async fetchListById(id: number): Promise<PageList | null> {
        return this.operation('findListById', { id })
    }

    async fetchListByIds(ids: number[]): Promise<PageList[]> {
        const listsData: PageList[] = await this.operation('findListsByIds', {
            ids,
        })
        const orderedLists: PageList[] = []

        for (const listId of new Set(ids)) {
            const data = listsData.find((list) => list.id === listId)
            if (data) {
                orderedLists.push(data)
            }
        }

        return orderedLists
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

    async fetchListEntry(
        listId: number,
        pageUrl: string,
    ): Promise<PageListEntry | null> {
        return this.operation('findListEntry', { listId, pageUrl })
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

        const lists: PageList[] = (
            await this.operation('findListsIncluding', {
                includedIds: [...listIds],
            })
        ).filter(CustomListStorage.filterOutSpecialLists)

        return lists.map((list) => {
            const entries = entriesByListId.get(list.id)
            return this.prepareList(list, entries, entries != null)
        })
    }

    async fetchPageListEntriesByUrl({
        normalizedPageUrl,
    }: {
        normalizedPageUrl: string
    }) {
        const pageListEntries: PageListEntry[] = await this.operation(
            'findListEntriesByUrl',
            { url: normalizedPageUrl },
        )
        return pageListEntries
    }

    async fetchListPageEntriesByUrls({
        listId,
        normalizedPageUrls,
    }: {
        listId: number
        normalizedPageUrls: string[]
    }) {
        const pageListEntries: PageListEntry[] = await this.operation(
            'findListEntriesByUrls',
            { urls: normalizedPageUrls, listId },
        )
        return pageListEntries
    }

    async insertCustomList({
        id,
        type,
        name,
        isDeletable = true,
        isNestable = true,
        createdAt = new Date(),
        analyticsBG,
        dontTrack,
    }: {
        id: number
        type?: string
        name: string
        isDeletable?: boolean
        isNestable?: boolean
        createdAt?: Date
        analyticsBG?: AnalyticsCoreInterface
        dontTrack?: boolean
    }): Promise<number> {
        const { object } = await this.operation('createList', {
            id,
            name,
            type,
            isNestable,
            isDeletable,
            searchableName: name,
            createdAt,
        })

        if (analyticsBG && dontTrack == null) {
            try {
                await trackSpaceCreate(analyticsBG, { type: 'private' })
            } catch (error) {
                console.error(`Error tracking space create event', ${error}`)
            }
        }

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
    async findPageByUrl(normalizedUrl: string) {
        console.log('normalizedUrl', normalizedUrl)
        return await this.operation('findPageByUrl', {
            url: normalizedUrl,
        })
    }

    async createOrUpdateListDescription({
        listId,
        description,
    }: {
        listId: number
        description: string
    }): Promise<void> {
        const existing = await this.fetchListDescriptionByList(listId)
        await this.operation(
            existing ? 'updateListDescription' : 'createListDescription',
            { listId, description },
        )
    }

    async removeListAssociatedData({ listId }: { listId: number }) {
        await this.operation('deleteListEntriesByListId', { listId })
        await this.deleteListDescriptions({ listId })
    }

    async removeList({ id }: { id: number }) {
        await this.operation('deleteList', { id })
    }

    async checkIfPageInfilteredList({
        url,
        listNames,
    }: {
        url: string
        listNames: string[]
    }): Promise<boolean> {
        let listEntries = await this.fetchListIdsByUrl(normalizeUrl(url))

        if (listEntries?.length === 0) {
            return false
        }

        listEntries = listEntries.filter((item) => item != 20201014)

        for (const listEntry of listEntries) {
            const listData = await this.operation('findListById', {
                id: listEntry,
            })
            const listName = listData.name

            if (listNames.includes(listName)) {
                return true
            }
        }
    }

    async insertPageToList({
        listId,
        pageUrl,
        fullUrl,
        createdAt = new Date(),
        pageTitle,
        analyticsBG,
        isShared,
        dontTrack,
    }: {
        listId: number
        pageUrl: string
        fullUrl: string
        createdAt?: Date
        pageTitle?: string
        analyticsBG?: AnalyticsCoreInterface
        isShared?: boolean
        dontTrack?: boolean
    }) {
        const list = await this.fetchListById(listId)
        const idExists = Boolean(list)

        if (idExists) {
            if (
                analyticsBG &&
                dontTrack == null &&
                listId !== SPECIAL_LIST_IDS.INBOX &&
                listId !== SPECIAL_LIST_IDS.MOBILE
            ) {
                try {
                    await trackSpaceEntryCreate(analyticsBG, {
                        type: isShared ? 'shared' : 'private',
                    })
                } catch (error) {
                    console.error(
                        `Error tracking space Entry create event', ${error}`,
                    )
                }
            }

            if (isPkmSyncEnabled()) {
                try {
                    const pageToSave = await this.operation('findPageByUrl', {
                        url: normalizeUrl(fullUrl),
                    })

                    const dataToSave = {
                        pageUrl: fullUrl,
                        pageTitle: pageToSave.fullTitle,
                        pkmSyncType: 'page',
                        pageSpaces: list.name,
                        createdWhen: Date.now(),
                    }

                    sharePageWithPKM(
                        dataToSave,
                        this.options.pkmSyncBG,
                        async (url, listNames) =>
                            await this.checkIfPageInfilteredList({
                                url: url,
                                listNames: listNames,
                            }),
                    )
                } catch (error) {}
            }

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
        if (isPkmSyncEnabled()) {
            try {
                const list = await this.fetchListById(listId)
                const pageToSave = await this.operation('findPageByUrl', {
                    url: normalizeUrl(pageUrl),
                })

                const dataToSave = {
                    pageUrl: pageUrl,
                    pageTitle: pageToSave.fullTitle,
                    pkmSyncType: 'page',
                    pageSpaces: list.name,
                    createdWhen: Date.now(),
                }

                sharePageWithPKM(dataToSave, this.options.pkmSyncBG)
            } catch (error) {}
        }

        return this.operation('deleteListEntriesById', { listId, pageUrl })
    }
    async removeAllListPages({ listId }: { listId: number }) {
        return this.operation('deleteListEntriesByListId', { listId })
    }

    async deleteListDescriptions({
        listId,
    }: {
        listId: number
    }): Promise<void> {
        await this.operation('deleteListDescriptions', { listId })
    }

    async suggestLists({
        query,
        limit = 20,
    }: {
        query: string
        limit?: number
    }): Promise<PageList[]> {
        // Ensure any term delimiters replaced with spaces
        const formattedQuery = query.replace(DEFAULT_TERM_SEPARATOR, ' ')

        const suggestions: SuggestResult<string, number> = await this.operation(
            SuggestPlugin.SUGGEST_OBJS_OP_ID,
            {
                collection: CustomListStorage.CUSTOM_LISTS_COLL,
                query: { nameTerms: formattedQuery },
                options: {
                    multiEntryAssocField: 'name',
                    ignoreCase: ['nameTerms'],
                    limit,
                },
            },
        )

        const suggestedLists: PageList[] = await this.operation(
            'findListsIncluding',
            {
                includedIds: suggestions.map(({ pk }) => pk),
            },
        )

        return suggestedLists.filter(CustomListStorage.filterOutSpecialLists)
    }

    async fetchListIgnoreCase({ name }: { name: string }) {
        return this.operation('findListByNameIgnoreCase', { name })
    }
}
