import StorageManager from '@worldbrain/storex'
import { ContentSharingInterface } from './types'
import { ContentSharingStorage, ContentSharingClientStorage } from './storage'
import CustomListStorage from 'src/custom-lists/background/storage'
import { AuthBackground } from 'src/authentication/background'
import { SharedListEntry } from '@worldbrain/memex-common/lib/content-sharing/types'

export default class ContentSharingBackground {
    remoteFunctions: ContentSharingInterface
    storage: ContentSharingClientStorage
    listPushes: {
        [localListId: number]: {
            startedWhen: number
            finishedWhen: number
            promise: Promise<void>
        }
    } = {}

    constructor(
        private options: {
            storageManager: StorageManager
            customLists: CustomListStorage
            auth: AuthBackground
            getContentSharing: () => Promise<ContentSharingStorage>
        },
    ) {
        this.storage = new ContentSharingClientStorage({
            storageManager: options.storageManager,
        })

        this.remoteFunctions = {
            shareList: this.shareList,
            shareListEntries: this.shareListEntries,
            areListsShared: async (options) => {
                const shared: { [listId: number]: boolean } = {}
                for (const listId of options.listIds) {
                    shared[listId] = false
                }
                return shared
            },
        }
    }

    shareList: ContentSharingInterface['shareList'] = async (options) => {
        const localList = await this.options.customLists.fetchListById(
            options.listId,
        )
        if (!localList) {
            throw new Error(
                `Tried to share non-existing list: ID ${options.listId}`,
            )
        }
        const userId = (await this.options.auth.authService.getCurrentUser())
            ?.id
        if (!userId) {
            throw new Error(`Tried to share list without being authenticated`)
        }

        const contentSharing = await this.options.getContentSharing()
        const listReference = await contentSharing.createSharedList({
            listData: {
                title: localList.name,
            },
            userReference: {
                type: 'user-reference',
                id: userId,
            },
        })
        await this.storage.storeListId({
            localId: options.listId,
            remoteId: contentSharing.getSharedListLinkID(listReference),
        })

        return {
            remoteListId: contentSharing.getSharedListLinkID(listReference),
        }
    }

    shareListEntries: ContentSharingInterface['shareListEntries'] = async (
        options,
    ) => {
        const userId = (await this.options.auth.authService.getCurrentUser())
            ?.id
        if (!userId) {
            throw new Error(`Tried to share list without being authenticated`)
        }
        const remoteId = await this.storage.getRemoteListId({
            localId: options.listId,
        })
        if (!remoteId) {
            throw new Error(
                `Tried to share list entries of list that isn't shared yet`,
            )
        }
        const pages = await this.options.customLists.fetchListPagesById({
            listId: options.listId,
        })
        const pageTitles = await this.storage.getPageTitles({
            normalizedPageUrls: pages.map((entry) => entry.pageUrl),
        })

        const contentSharing = await this.options.getContentSharing()
        await contentSharing.createListEntries({
            listReference: contentSharing.getSharedListReferenceFromLinkID(
                remoteId,
            ),
            listEntries: pages.map((entry) => ({
                entryTitle: pageTitles[entry.pageUrl],
                normalizedUrl: entry.pageUrl,
                originalUrl: entry.fullUrl,
            })),
            userReference: { type: 'user-reference', id: userId },
        })
    }
}
