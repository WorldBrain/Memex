import StorageManager from '@worldbrain/storex'
import { ContentSharingInterface, ContentSharingAction } from './types'
import { ContentSharingStorage, ContentSharingClientStorage } from './storage'
import CustomListStorage from 'src/custom-lists/background/storage'
import { AuthBackground } from 'src/authentication/background'
import { SharedListEntry } from '@worldbrain/memex-common/lib/content-sharing/types'
import { StorageOperationEvent } from '@worldbrain/storex-middleware-change-watcher/lib/types'
import { PageListEntry } from 'src/custom-lists/background/types'
import createResolvable, { Resolvable } from '@josephg/resolvable'
import { normalizeUrl } from '@worldbrain/memex-url-utils'

interface ListPush {
    startedWhen: number
    finishedWhen?: number
    promise: Resolvable<void>
}

export default class ContentSharingBackground {
    remoteFunctions: ContentSharingInterface
    storage: ContentSharingClientStorage
    listPushes: {
        [localListId: number]: ListPush
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
                originalUrl: 'https://' + normalizeUrl(entry.fullUrl),
            })),
            userReference: { type: 'user-reference', id: userId },
        })
    }

    waitForListSync: ContentSharingInterface['waitForListSync'] = async (
        options,
    ) => {
        return this.listPushes[options.localListId]?.promise
    }

    async scheduleAction(action: ContentSharingAction) {
        await this.executeAction(action)
    }

    async executeAction(action: ContentSharingAction) {
        if (action.type === 'add-shared-list-entry') {
            await this.doPush({ localListId: action.localListId }, async () => {
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
                    listEntries: [action.data],
                    userReference: { type: 'user-reference', id: userId },
                })
            })
        } else if (action.type === 'change-shared-list-title') {
            await this.doPush({ localListId: action.localListId }, async () => {
                const contentSharing = await this.options.getContentSharing()
                await contentSharing.updateListTitle(
                    contentSharing.getSharedListReferenceFromLinkID(
                        action.remoteListId,
                    ),
                    action.newTitle,
                )
            })
        }
    }

    async doPush(
        options: { localListId: number },
        execute: () => Promise<void>,
    ) {
        await this.listPushes[options.localListId]?.promise

        const push: ListPush = {
            startedWhen: Date.now(),
            promise: createResolvable(),
        }
        this.listPushes[options.localListId] = push
        await execute()
        push.finishedWhen = Date.now()
        push.promise.resolve()
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
                        type: 'add-shared-list-entry',
                        localListId,
                        remoteListId,
                        data: {
                            entryTitle: pageTitle,
                            normalizedUrl: pageUrl,
                            originalUrl: 'https://' + normalizeUrl(listEntry.fullUrl),
                        },
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
            }
        }
    }
}
