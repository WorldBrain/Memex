import { FeatureStorage } from '../../search/storage'
import { PageList, PageListEntry } from './types'

export default class CustomListStorage extends FeatureStorage {
    static CUSTOM_LISTS_COLL = 'customLists'
    static LIST_ENTRIES_COLL = 'pageListEntries'

    constructor({ storageManager }) {
        super(storageManager)
        this.storageManager.registry.registerCollections({
            [CustomListStorage.CUSTOM_LISTS_COLL]: {
                version: new Date(2018, 6, 12),
                fields: {
                    id: { type: 'string', pk: true },
                    name: { type: 'string' },
                    isDeletable: { type: 'boolean' },
                    isNestable: { type: 'boolean' },
                    createdAt: { type: 'datetime' },
                },
                indices: [
                    { field: 'id', pk: true },
                    { field: 'name', unique: true },
                    { field: 'isDeletable' },
                    { field: 'isNestable' },
                    { field: 'createdAt' },
                ],
            },
            [CustomListStorage.LIST_ENTRIES_COLL]: {
                version: new Date(2018, 6, 12),
                fields: {
                    listId: { type: 'string' },
                    pageUrl: { type: 'string' },
                    fullUrl: { type: 'string' },
                    createdAt: { type: 'datetime' },
                },
                indices: [
                    { field: ['listId', 'pageUrl'], pk: true },
                    { field: 'listId' },
                    { field: 'pageUrl' },
                ],
            },
        })
    }

    private changeListsBeforeSending(
        lists: PageList[],
        pageEntries: PageListEntry[],
    ): PageList[] {
        const mappedLists = lists.map(list => {
            const page = pageEntries.find(({ listId }) => listId === list.id)
            delete list['_name_terms']
            return {
                ...list,
                // Set an empty pages array for manupulating in redux store.
                pages: [],
                active: Boolean(page),
            }
        })
        return mappedLists
    }

    //  TODO: Use pagination if required
    async fetchAllLists({
        query = {},
        opts = {},
    }: {
        query?: any
        opts?: any
    }) {
        const x = await this.storageManager
            .collection(CustomListStorage.CUSTOM_LISTS_COLL)
            .findObjects<PageList>(query, opts)
        return this.changeListsBeforeSending(x, [])
    }

    async fetchListById(id: number) {
        const list = await this.storageManager
            .collection(CustomListStorage.CUSTOM_LISTS_COLL)
            .findOneObject<PageList>({ id })

        if (!list) {
            return null
        }

        const pages = await this.storageManager
            .collection(CustomListStorage.LIST_ENTRIES_COLL)
            .findObjects<PageListEntry>({
                listId: list.id,
            })
        delete list['_name_terms']
        return {
            ...list,
            pages: pages.map(({ fullUrl }) => fullUrl),
        }
    }

    async fetchListPagesById({ listId }: { listId: number }) {
        return this.storageManager
            .collection(CustomListStorage.LIST_ENTRIES_COLL)
            .findObjects({ listId })
    }

    async fetchListPagesByUrl({ url }: { url: string }) {
        const pages = await this.storageManager
            .collection(CustomListStorage.LIST_ENTRIES_COLL)
            .findObjects<PageListEntry>({
                pageUrl: url,
            })
        const listIds = pages.map(({ listId }) => listId)
        const lists = await this.fetchAllLists({
            query: {
                id: { $in: listIds },
            },
        })
        return this.changeListsBeforeSending(lists, pages)
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
        const { object } = await this.storageManager
            .collection(CustomListStorage.CUSTOM_LISTS_COLL)
            .createObject({
                id,
                name,
                isDeletable,
                isNestable,
                createdAt: new Date(),
            })

        return object.id
    }

    async updateListName({ id, name }: { id: number; name: string }) {
        return this.storageManager
            .collection(CustomListStorage.CUSTOM_LISTS_COLL)
            .updateOneObject(
                {
                    id,
                },
                {
                    $set: {
                        name,
                        createdAt: new Date(),
                    },
                },
            )
    }

    async removeList({ id }: { id: number }) {
        const list = await this.storageManager
            .collection(CustomListStorage.CUSTOM_LISTS_COLL)
            .deleteOneObject({
                id,
            })
        const pages = await this.storageManager
            .collection(CustomListStorage.LIST_ENTRIES_COLL)
            .deleteObjects({
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
            return this.storageManager
                .collection(CustomListStorage.LIST_ENTRIES_COLL)
                .createObject({
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
        return this.storageManager
            .collection(CustomListStorage.LIST_ENTRIES_COLL)
            .deleteObjects({
                listId,
                pageUrl,
            })
    }

    async fetchListNameSuggestions({
        name,
        url,
    }: {
        name: string
        url: string
    }) {
        const suggestions = await this.storageManager
            .collection(CustomListStorage.CUSTOM_LISTS_COLL)
            .suggestObjects<string, number>(
                {
                    name,
                },
                {
                    includePks: true,
                    ignoreCase: ['name'],
                    limit: 5,
                },
            )
        const listIds = suggestions.map(({ pk }) => pk)

        const lists: PageList[] = suggestions.map(({ pk, suggestion }) => ({
            id: pk,
            name: suggestion,
        }))

        const pageEntries = await this.storageManager
            .collection(CustomListStorage.LIST_ENTRIES_COLL)
            .findObjects<PageListEntry>({
                listId: { $in: listIds },
                pageUrl: url,
            })

        return this.changeListsBeforeSending(lists, pageEntries)
    }

    async fetchListIgnoreCase({ name }: { name: string }) {
        return this.storageManager
            .collection(CustomListStorage.CUSTOM_LISTS_COLL)
            .findOneObject<PageList>(
                {
                    name,
                },
                {
                    ignoreCase: ['name'],
                },
            )
    }
}
