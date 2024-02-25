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
import type {
    PageList,
    PageListEntry,
    ListDescription,
    ListTree,
} from './types'
import { STORAGE_VERSIONS } from 'src/storage/constants'
import { DEFAULT_TERM_SEPARATOR } from '@worldbrain/memex-stemmer/lib/constants'
import {
    trackSpaceCreate,
    trackSpaceEntryCreate,
} from '@worldbrain/memex-common/lib/analytics/events'
import type { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import {
    defaultOrderableSorter,
    insertOrderedItemBeforeIndex,
    pushOrderedItem,
} from '@worldbrain/memex-common/lib/utils/item-ordering'
import {
    isPkmSyncEnabled,
    sharePageWithPKM,
} from 'src/pkm-integrations/background/backend/utils'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import {
    buildMaterializedPath,
    extractMaterializedPathIds,
} from 'src/content-sharing/utils'
import fromPairs from 'lodash/fromPairs'
import { ROOT_NODE_PARENT_ID } from '@worldbrain/memex-common/lib/content-sharing/tree-utils'
import type { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'
import type { OperationBatch } from '@worldbrain/storex'
import { moveTree } from '@worldbrain/memex-common/lib/content-sharing/storage/move-tree'

const cleanListTree = (listTree: ListTree) => ({
    ...listTree,
    parentListId:
        listTree.parentListId === ROOT_NODE_PARENT_ID
            ? null
            : listTree.parentListId,
})

export default class CustomListStorage extends StorageModule {
    static LIST_DESCRIPTIONS_COLL = COLLECTION_NAMES.listDescription
    static CUSTOM_LISTS_COLL = COLLECTION_NAMES.list
    static LIST_ENTRIES_COLL = COLLECTION_NAMES.listEntry
    static LIST_TREES_COLL = COLLECTION_NAMES.listTrees

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
                createListTree: {
                    collection: CustomListStorage.LIST_TREES_COLL,
                    operation: 'createObject',
                },
                countListEntries: {
                    collection: CustomListStorage.LIST_ENTRIES_COLL,
                    operation: 'countObjects',
                    args: { listId: '$listId:int' },
                },
                findListTreeByListId: {
                    collection: CustomListStorage.LIST_TREES_COLL,
                    operation: 'findObject',
                    args: { listId: '$listId:int' },
                },
                findListTreesByParentListId: {
                    collection: CustomListStorage.LIST_TREES_COLL,
                    operation: 'findObjects',
                    args: { parentListId: '$parentListId:int' },
                },
                findListTreesByLocalListIds: {
                    collection: CustomListStorage.LIST_TREES_COLL,
                    operation: 'findObjects',
                    args: { listId: { $in: '$listIds:int[]' } },
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
                updateListTreeOrder: {
                    collection: CustomListStorage.LIST_TREES_COLL,
                    operation: 'updateObjects',
                    args: [
                        { listId: '$listId:int' },
                        {
                            order: '$order:int',
                            updatedWhen: '$updatedWhen:number',
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
                deleteListDescriptions: {
                    collection: CustomListStorage.LIST_DESCRIPTIONS_COLL,
                    operation: 'deleteObjects',
                    args: { listId: '$listId:pk' },
                },
                deleteListTreeByListId: {
                    collection: CustomListStorage.LIST_TREES_COLL,
                    operation: 'deleteObjects',
                    args: { listId: '$listId:int' },
                },
                deleteListTreeByLinkTarget: {
                    collection: CustomListStorage.LIST_TREES_COLL,
                    operation: 'deleteObjects',
                    args: { linkTarget: '$listId:int' },
                },
                deleteListTreeById: {
                    collection: CustomListStorage.LIST_TREES_COLL,
                    operation: 'deleteObjects',
                    args: { id: '$id:int' },
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

    async createListTree(params: {
        localListId: number
        parentListId?: number
        pathIds?: number[]
        now?: number
        order?: number
        isLink?: boolean
        skipSyncEntry?: boolean
    }): Promise<ListTree> {
        const existingList = await this.fetchListById(params.localListId)
        if (!existingList) {
            throw new Error(
                `List does not exist to create list tree data for: ${params}`,
            )
        }
        const parentListId = params.parentListId ?? ROOT_NODE_PARENT_ID

        let order: number
        if (params.order != null) {
            order = params.order
        } else {
            // Look up all sibling nodes to determine order of this one
            const siblingNodes: ListTree[] = await this.operation(
                'findListTreesByParentListId',
                {
                    parentListId,
                },
            )
            const items = siblingNodes
                .sort(defaultOrderableSorter)
                .map((node) => ({
                    id: node.id,
                    key: node.order,
                }))
            order =
                items.length > 0
                    ? insertOrderedItemBeforeIndex(items, '', 0).create.key
                    : pushOrderedItem(items, '').create.key
        }

        const now = params.now ?? Date.now()
        const listTree: Omit<ListTree, 'id'> = {
            parentListId,
            listId: params.isLink ? null : params.localListId,
            linkTarget: params.isLink ? params.localListId : null,
            path: params.pathIds?.length
                ? buildMaterializedPath(...params.pathIds)
                : null,
            order,
            createdWhen: now,
            updatedWhen: now,
        }

        const opExecuter = params.skipSyncEntry
            ? this.options.storageManager.backend
            : this.options.storageManager

        const { object } = await opExecuter.operation(
            'createObject',
            'customListTrees',
            listTree,
        )
        return { ...listTree, id: object.id }
    }

    /**
     * Climbs up from the given node to the tree root to build an array of customListTree IDs,
     * in order from root to parent of the given noe.
     */
    async getMaterializedPathIdsFromTree(params: {
        id: number
    }): Promise<number[]> {
        const pathIds: number[] = [params.id]
        let parentListId = params.id
        while (true) {
            const currentNode: ListTree = await this.operation(
                'findListTreeByListId',
                { listId: parentListId },
            )
            parentListId = currentNode?.parentListId
            if (parentListId === ROOT_NODE_PARENT_ID || parentListId == null) {
                break
            }
            pathIds.unshift(parentListId)
        }
        return pathIds
    }

    async getTreesByParent(params: {
        parentListId: number
    }): Promise<ListTree[]> {
        const listTrees: ListTree[] = await this.operation(
            'findListTreesByParentListId',
            { parentListId: params.parentListId },
        )
        // TODO: Maybe order them
        return listTrees.map(cleanListTree)
    }

    async getTreeDataForList(params: {
        localListId: number
    }): Promise<ListTree | null> {
        const currentNode: ListTree = await this.operation(
            'findListTreeByListId',
            { listId: params.localListId },
        )
        return currentNode ? cleanListTree(currentNode) : null
    }

    async getTreeDataForLists(params: {
        localListIds: number[]
    }): Promise<{ [localListId: number]: ListTree | null }> {
        const listTrees: ListTree[] = await this.operation(
            'findListTreesByLocalListIds',
            { listIds: params.localListIds },
        )
        return fromPairs(
            listTrees.map((tree) => [tree.listId, cleanListTree(tree)]),
        )
    }

    async updateListTreeParent(params: {
        localListId: number
        newParentListId: number | null
        now?: number
    }): Promise<void> {
        const updatedWhen = params.now ?? Date.now()

        const batch: OperationBatch = []
        await moveTree<ListTree>({
            nodeId: params.localListId,
            newParentNodeId: params.newParentListId,
            selectNodeId: (node) => node.listId ?? node.linkTarget,
            selectNodeParentId: (node) => node.parentListId,
            retrieveNode: (localListId) =>
                this.getTreeDataForList({
                    localListId: localListId as number,
                }),
            createNode: (localListId, parentNode) =>
                this.createListTree({
                    localListId: localListId as number,
                    parentListId: parentNode?.listId,
                    pathIds:
                        parentNode != null
                            ? [
                                  ...(extractMaterializedPathIds(
                                      parentNode.path,
                                      'number',
                                  ) as number[]),
                                  parentNode.listId,
                              ]
                            : undefined,
                    now: params.now,
                    skipSyncEntry: true,
                }),
            getChildrenOfNode: (node) =>
                this.getTreesByParent({
                    parentListId: node.listId,
                }),
            isNodeALeaf: (node) => node.linkTarget != null,
            updateNodesParent: (node, parentNode) => {
                node.parentListId = parentNode?.listId ?? ROOT_NODE_PARENT_ID
                node.path =
                    parentNode != null
                        ? buildMaterializedPath(
                              ...extractMaterializedPathIds(
                                  parentNode.path ?? '',
                                  'number',
                              ),
                              parentNode.listId,
                          )
                        : null

                batch.push({
                    collection: CustomListStorage.LIST_TREES_COLL,
                    operation: 'updateObjects',
                    where: { id: node.id },
                    updates: {
                        path: node.path,
                        parentListId: node.parentListId,
                        updatedWhen,
                    },
                })
            },
            assertSuitableParent: (node) => {
                if (node?.linkTarget != null) {
                    throw new Error(
                        'Cannot move a list tree node to be a child of a link target node',
                    )
                }
            },
        })

        // Note we're running this on the storage backend so that it skips storex middleware and doesn't get synced (tree updates handled in a special way for sync)
        await this.options.storageManager.backend.executeBatch(batch)
    }

    async isListAAncestorOfListB(
        listAId: number,
        listBId: number,
    ): Promise<boolean> {
        const startingNode = await this.getTreeDataForList({
            localListId: listBId,
        })
        if (!startingNode) {
            return false
        }
        const pathIds = extractMaterializedPathIds(startingNode.path, 'number')
        return pathIds.includes(listAId)
    }

    async deleteListTree(params: { treeId: number }): Promise<void> {
        await this.operation('deleteListTreeById', { id: params.treeId })
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

    async updateListTreeOrder(params: {
        localListId: number
        order: number
        now?: number
    }): Promise<void> {
        await this.operation('updateListTreeOrder', {
            listId: params.localListId,
            order: params.order,
            updatedWhen: params.now ?? Date.now(),
        })
    }

    async deleteListTreeLink(params: { localListId: number }): Promise<void> {
        await this.operation('deleteListTreeByLinkTarget', {
            listId: params.localListId,
        })
    }

    /**
     * Returns an array of all list IDs in the list tree starting at the given root in BFS order.
     */
    async getAllNodesInTreeByList(params: {
        rootLocalListId: number
    }): Promise<ListTree[]> {
        const listTree = await this.getTreeDataForList({
            localListId: params.rootLocalListId,
        })
        if (!listTree) {
            throw new Error('Could not find root data of tree to traverse')
        }
        // Link nodes are always leaves
        if (listTree.linkTarget != null) {
            return [listTree]
        }

        const materializedPath = buildMaterializedPath(
            ...extractMaterializedPathIds(listTree.path ?? '', 'number'),
            listTree.listId,
        )
        const storageBackend = this.options.storageManager
            .backend as DexieStorageBackend

        const listTrees: ListTree[] = await storageBackend.dexieInstance
            .table('customListTrees')
            .where('path')
            .startsWith(materializedPath)
            .toArray()

        listTrees.push(listTree)

        // TODO: Maybe sort each level of siblings
        return listTrees
    }

    async removeListAssociatedData({ listId }: { listId: number }) {
        await this.operation('deleteListEntriesByListId', { listId })
        await this.operation('deleteListTreeByListId', { listId })
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
