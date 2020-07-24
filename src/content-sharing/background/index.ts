import StorageManager from '@worldbrain/storex'
import {
    ContentSharingInterface,
    ContentSharingAction,
    AddSharedListEntriesAction,
} from './types'
import { ContentSharingStorage, ContentSharingClientStorage } from './storage'
import CustomListStorage from 'src/custom-lists/background/storage'
import { AuthBackground } from 'src/authentication/background'
import { SharedListEntry } from '@worldbrain/memex-common/lib/content-sharing/types'
import { StorageOperationEvent } from '@worldbrain/storex-middleware-change-watcher/lib/types'
import { PageListEntry } from 'src/custom-lists/background/types'
import createResolvable, { Resolvable } from '@josephg/resolvable'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import { Analytics } from 'src/analytics/types'

// interface ListPush {
//     actionsPending: number
//     promise: Resolvable<void> | null
// }

export default class ContentSharingBackground {
    remoteFunctions: ContentSharingInterface
    storage: ContentSharingClientStorage

    _hasPendingActions = false
    _pendingActionsRetry?: Resolvable<void>
    _executingPendingActions?: Resolvable<{ result: 'success' | 'error' }>
    private readonly ACTION_RETRY_INTERVAL = 1000 * 60 * 5

    // _listPushes: {
    //     [localListId: number]: ListPush
    // } = {}

    constructor(
        private options: {
            storageManager: StorageManager
            customLists: CustomListStorage
            auth: AuthBackground
            analytics: Analytics
            getContentSharing: () => Promise<ContentSharingStorage>
        },
    ) {
        this.storage = new ContentSharingClientStorage({
            storageManager: options.storageManager,
        })

        this.remoteFunctions = {
            shareList: this.shareList,
            shareListEntries: this.shareListEntries,
            getRemoteListId: async (options) => {
                return this.storage.getRemoteListId({
                    localId: options.localListId,
                })
            },
            areListsShared: async (options) => {
                return this.storage.areListsShared({
                    localIds: options.localListIds,
                })
            },
            waitForListSync: this.waitForListSync,
        }
    }

    async setup() {
        try {
            await this.executePendingActions()
        } catch (e) {
            // Log the error, but don't stop the entire extension setup
            // when we can't reach the sharing back-end
            console.error(e)
        }
    }
    _setTimeout = setTimeout

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
            localListId: options.listId,
        })
        await this.storage.storeListId({
            localId: options.listId,
            remoteId: contentSharing.getSharedListLinkID(listReference),
        })

        this.options.analytics.trackEvent({
            category: 'ContentSharing',
            action: 'shareList',
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

        const chunkSize = 100
        for (
            let startIndex = 0;
            startIndex < pages.length;
            startIndex += chunkSize
        ) {
            const data: AddSharedListEntriesAction['data'] = pages
                .slice(startIndex, startIndex + chunkSize)
                .map((entry) => ({
                    createdWhen: entry.createdAt?.getTime() ?? '$now',
                    entryTitle: pageTitles[entry.pageUrl],
                    normalizedUrl: entry.pageUrl,
                    originalUrl: entry.fullUrl,
                }))
            await this.scheduleAction({
                type: 'add-shared-list-entries',
                localListId: options.listId,
                remoteListId: remoteId,
                data,
            })
        }
    }

    waitForListSync: ContentSharingInterface['waitForListSync'] = async (
        options,
    ) => {
        await this._executingPendingActions
    }

    async scheduleAction(action: ContentSharingAction) {
        this._hasPendingActions = true
        await this.storage.queueAction({ action })
        if (!this._pendingActionsRetry) {
            await this.executePendingActions()
        }
    }

    async executePendingActions() {
        if (this._executingPendingActions || !this._hasPendingActions) {
            return
        }

        const executingPendingActions = (this._executingPendingActions = createResolvable())
        if (this._pendingActionsRetry) {
            this._pendingActionsRetry.resolve()
            delete this._pendingActionsRetry
        }

        try {
            while (true) {
                const action = await this.storage.peekAction()
                if (!action) {
                    break
                }

                await this.executeAction(action)
                await this.storage.removeAction({ actionId: action.id })
            }
            this._hasPendingActions = false
            executingPendingActions.resolve({ result: 'success' })
        } catch (e) {
            this._pendingActionsRetry = createResolvable()
            executingPendingActions.resolve({ result: 'error' })
            this._setTimeout(
                () => this.executePendingActions(),
                this.ACTION_RETRY_INTERVAL,
            )
            throw e
        } finally {
            delete this._executingPendingActions
        }
    }

    async executeAction(action: ContentSharingAction) {
        if (action.type === 'add-shared-list-entries') {
            const userId = (
                await this.options.auth.authService.getCurrentUser()
            )?.id
            if (!userId) {
                throw new Error(
                    `Tried to share list without being authenticated`,
                )
            }
            const contentSharing = await this.options.getContentSharing()
            await contentSharing.createListEntries({
                listReference: contentSharing.getSharedListReferenceFromLinkID(
                    action.remoteListId,
                ),
                listEntries: action.data,
                userReference: { type: 'user-reference', id: userId },
            })

            this.options.analytics.trackEvent({
                category: 'ContentSharing',
                action: 'shareListEntryBatch',
                value: { size: action.data.length },
            })
        } else if (action.type === 'remove-shared-list-entry') {
            const contentSharing = await this.options.getContentSharing()
            await contentSharing.removeListEntries({
                listReference: contentSharing.getSharedListReferenceFromLinkID(
                    action.remoteListId,
                ),
                normalizedUrl: action.normalizedUrl,
            })

            this.options.analytics.trackEvent({
                category: 'ContentSharing',
                action: 'unshareListEntry',
            })
        } else if (action.type === 'change-shared-list-title') {
            const contentSharing = await this.options.getContentSharing()
            await contentSharing.updateListTitle(
                contentSharing.getSharedListReferenceFromLinkID(
                    action.remoteListId,
                ),
                action.newTitle,
            )
        }
    }

    async handlePostStorageChange(event: StorageOperationEvent<'post'>) {
        for (const change of event.info.changes) {
            if (change.type === 'create') {
                if (change.collection === 'pageListEntries') {
                    const listEntry = change.values as Pick<
                        PageListEntry,
                        'fullUrl'
                    >
                    const [localListId, pageUrl] = change.pk as [number, string]
                    const remoteListId = await this.storage.getRemoteListId({
                        localId: localListId,
                    })
                    if (!remoteListId) {
                        continue
                    }

                    const pageTitles = await this.storage.getPageTitles({
                        normalizedPageUrls: [pageUrl],
                    })
                    const pageTitle = pageTitles[pageUrl]
                    await this.scheduleAction({
                        type: 'add-shared-list-entries',
                        localListId,
                        remoteListId,
                        data: [
                            {
                                createdWhen: Date.now(),
                                entryTitle: pageTitle,
                                normalizedUrl: pageUrl,
                                originalUrl:
                                    'https://' +
                                    normalizeUrl(listEntry.fullUrl),
                            },
                        ],
                    })
                }
            } else if (change.type === 'modify') {
                if (change.collection === 'customLists') {
                    for (const pk of change.pks) {
                        const localListId = pk as number
                        const remoteListId = await this.storage.getRemoteListId(
                            {
                                localId: localListId,
                            },
                        )
                        if (!remoteListId) {
                            continue
                        }

                        await this.scheduleAction({
                            type: 'change-shared-list-title',
                            localListId,
                            remoteListId,
                            newTitle: change.updates.name,
                        })
                    }
                }
            } else if (change.type === 'delete') {
                if (change.collection === 'pageListEntries') {
                    for (const pk of change.pks) {
                        const [localListId, pageUrl] = pk as [number, string]
                        const remoteListId = await this.storage.getRemoteListId(
                            {
                                localId: localListId,
                            },
                        )
                        if (!remoteListId) {
                            continue
                        }

                        await this.scheduleAction({
                            type: 'remove-shared-list-entry',
                            localListId,
                            remoteListId,
                            normalizedUrl: pageUrl,
                        })
                    }
                }
            }
        }
    }
}
