import chunk from 'lodash/chunk'
import fromPairs from 'lodash/fromPairs'
import StorageManager from '@worldbrain/storex'
import {
    ContentSharingInterface,
    ContentSharingEvents,
    ContentSharingAction,
    ContentSharingQueueInteraction,
} from './types'
import { ContentSharingStorage, ContentSharingClientStorage } from './storage'
import CustomListStorage from 'src/custom-lists/background/storage'
import { AuthBackground } from 'src/authentication/background'
import {
    StorageOperationEvent,
    DeletionStorageChange,
    ModificationStorageChange,
    CreationStorageChange,
} from '@worldbrain/storex-middleware-change-watcher/lib/types'
import { PageListEntry } from 'src/custom-lists/background/types'
import createResolvable, { Resolvable } from '@josephg/resolvable'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import { Analytics } from 'src/analytics/types'
import AnnotationStorage from 'src/annotations/background/storage'
import { Annotation, AnnotationPrivacyLevels } from 'src/annotations/types'
import { getNoteShareUrl } from 'src/content-sharing/utils'
import {
    remoteEventEmitter,
    RemoteEventEmitter,
} from 'src/util/webextensionRPC'
import ActivityStreamsBackground from 'src/activity-streams/background'
import {
    UserMessageService,
    UserMessageEvents,
} from '@worldbrain/memex-common/lib/user-messages/service/types'
import {
    SharedListReference,
    SharedAnnotationReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { Services } from 'src/services/types'
import * as annotationUtils from 'src/annotations/utils'
import { ServerStorageModules } from 'src/storage/types'
import { ContentSharingBackend } from '@worldbrain/memex-common/lib/content-sharing/backend'

// interface ListPush {
//     actionsPending: number
//     promise: Resolvable<void> | null
// }

export default class ContentSharingBackground {
    remoteEmitter: RemoteEventEmitter<ContentSharingEvents>
    remoteFunctions: ContentSharingInterface
    storage: ContentSharingClientStorage
    shouldProcessSyncChanges = true

    _hasPendingActions = false
    _queingAction?: Resolvable<void>
    _executingPendingActions?: Resolvable<{ result: 'success' | 'error' }>
    _processingUserMessage?: Resolvable<void>

    _pendingActionsRetry?: Resolvable<void>
    _scheduledRetry: () => Promise<void>
    _scheduledRetryTimeout: ReturnType<typeof setTimeout>

    _ensuredPages: { [normalizedUrl: string]: string } = {}

    private readonly ACTION_RETRY_INTERVAL = 1000 * 60 * 5

    // _listPushes: {
    //     [localListId: number]: ListPush
    // } = {}

    constructor(
        private options: {
            storageManager: StorageManager
            backend: ContentSharingBackend
            customLists: CustomListStorage
            annotationStorage: AnnotationStorage
            auth: AuthBackground
            analytics: Analytics
            activityStreams: Pick<ActivityStreamsBackground, 'backend'>
            userMessages: UserMessageService
            services: Pick<Services, 'contentSharing'>
            getServerStorage: () => Promise<
                Pick<ServerStorageModules, 'contentSharing'>
            >
            generateServerId: (collectionName: string) => number | string
        },
    ) {
        this.storage = new ContentSharingClientStorage({
            storageManager: options.storageManager,
        })

        this.remoteEmitter = remoteEventEmitter('contentSharing', {
            broadcastToTabs: true,
        })

        this.remoteFunctions = {
            ...options.services.contentSharing,
            shareList: this.shareList,
            shareListEntries: this.shareListEntries,
            shareAnnotation: this.shareAnnotation,
            shareAnnotations: this.shareAnnotations,
            executePendingActions: this.executePendingActions.bind(this),
            shareAnnotationsToLists: this.shareAnnotationsToLists,
            unshareAnnotationsFromLists: this.unshareAnnotationsFromLists,
            unshareAnnotation: this.unshareAnnotation,
            ensureRemotePageId: this.ensureRemotePageId,
            getRemoteAnnotationLink: this.getRemoteAnnotationLink,
            getRemoteListId: async (callOptions) => {
                return this.storage.getRemoteListId({
                    localId: callOptions.localListId,
                })
            },
            getRemoteListIds: async (callOptions) => {
                return this.storage.getRemoteListIds({
                    localIds: callOptions.localListIds,
                })
            },
            getRemoteAnnotationIds: async (callOptions) => {
                return this.storage.getRemoteAnnotationIds({
                    localIds: callOptions.annotationUrls,
                })
            },
            getRemoteAnnotationMetadata: async (callOptions) => {
                return this.storage.getRemoteAnnotationMetadata({
                    localIds: callOptions.annotationUrls,
                })
            },
            areListsShared: async (callOptions) => {
                return this.storage.areListsShared({
                    localIds: callOptions.localListIds,
                })
            },
            getAllRemoteLists: this.getAllRemoteLists,
            waitForSync: this.waitForSync,
        }
        options.userMessages.events.on('message', this._processUserMessage)
    }

    async setup() {
        try {
            // this method is awaited in the program setup, so don't block that
            // by awaiting pending actions (which could take a long time)
            this.executePendingActions()
        } catch (e) {
            // Log the error, but don't stop the entire extension setup
            // when we can't reach the sharing back-end
            console.error(e)
        }
    }

    private getRemoteAnnotationLink: ContentSharingInterface['getRemoteAnnotationLink'] = async ({
        annotationUrl,
    }) => {
        const remoteIds = await this.storage.getRemoteAnnotationIds({
            localIds: [annotationUrl],
        })
        const remoteAnnotationId = remoteIds[annotationUrl]?.toString()

        if (remoteAnnotationId == null) {
            return null
        }

        return getNoteShareUrl({ remoteAnnotationId })
    }

    getAllRemoteLists: ContentSharingInterface['getAllRemoteLists'] = async () => {
        const remoteListIdsDict = await this.storage.getAllRemoteListIds()
        const remoteListData: Array<{
            localId: number
            remoteId: string
            name: string
        }> = []

        for (const localId of Object.keys(remoteListIdsDict).map(Number)) {
            const list = await this.options.customLists.fetchListById(localId)
            remoteListData.push({
                localId,
                remoteId: remoteListIdsDict[localId],
                name: list.name,
            })
        }

        return remoteListData
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
        const remoteListId = this.options
            .generateServerId('sharedList')
            .toString()
        await this.storage.storeListId({
            localId: options.listId,
            remoteId: remoteListId,
        })

        this.options.analytics.trackEvent({
            category: 'ContentSharing',
            action: 'shareList',
        })

        return {
            remoteListId,
        }
    }

    shareListEntries: ContentSharingInterface['shareListEntries'] = async (
        options,
    ) => {}

    shareAnnotation: ContentSharingInterface['shareAnnotation'] = async (
        options,
    ) => {
        const remoteAnnotationId = (
            await this.storage.getRemoteAnnotationIds({
                localIds: [options.annotationUrl],
            })
        )[options.annotationUrl]
        if (remoteAnnotationId) {
            return
        }
        await this.storage.storeAnnotationMetadata([
            {
                localId: options.annotationUrl,
                remoteId: this.options
                    .generateServerId('sharedAnnotation')
                    .toString(),
                excludeFromLists: true,
            },
        ])

        this.options.analytics.trackEvent({
            category: 'ContentSharing',
            action: 'shareAnnotation',
        })
    }

    shareAnnotations: ContentSharingInterface['shareAnnotations'] = async (
        options,
    ) => {
        const remoteIds = await this.storage.getRemoteAnnotationIds({
            localIds: options.annotationUrls,
        })
        const allAnnotations = await this.options.annotationStorage.getAnnotations(
            options.annotationUrls,
        )
        const annotPrivacyLevels = await this.options.annotationStorage.getPrivacyLevelsByAnnotation(
            {
                annotations: options.annotationUrls,
            },
        )
        const annotations = allAnnotations.filter(
            (annotation) =>
                !remoteIds[annotation.url] &&
                (!annotPrivacyLevels[annotation.url] ||
                    annotPrivacyLevels[annotation.url]?.privacyLevel >
                        AnnotationPrivacyLevels.PROTECTED),
        )
        for (const annnotation of annotations) {
            await this.storage.storeAnnotationMetadata([
                {
                    localId: annnotation.url,
                    remoteId: this.options
                        .generateServerId('sharedAnnotation')
                        .toString(),
                    excludeFromLists: true, // TODO: should this be true or false?
                },
            ])
        }
    }

    shareAnnotationsToLists: ContentSharingInterface['shareAnnotationsToLists'] = async (
        options,
    ) => {
        await this.storage.setAnnotationsExcludedFromLists({
            localIds: options.annotationUrls,
            excludeFromLists: false,
        })
    }

    ensureRemotePageId: ContentSharingInterface['ensureRemotePageId'] = async (
        normalizedPageUrl,
    ) => {
        return 'NOT IMPLE'
    }

    unshareAnnotationsFromLists: ContentSharingInterface['unshareAnnotationsFromLists'] = async (
        options,
    ) => {
        await this.storage.setAnnotationsExcludedFromLists({
            localIds: options.annotationUrls,
            excludeFromLists: true,
        })
    }

    unshareAnnotation: ContentSharingInterface['unshareAnnotation'] = async (
        options,
    ) => {
        // const remoteAnnotationId = (
        //     await this.storage.getRemoteAnnotationIds({
        //         localIds: [options.annotationUrl],
        //     })
        // )[options.annotationUrl]
        // if (!remoteAnnotationId) {
        //     throw new Error(
        //         `Tried to unshare an annotation which was not shared`,
        //     )
        // }
        // await this.storage.deleteAnnotationMetadata({
        //     localIds: [options.annotationUrl],
        // })
        // const action: ContentSharingAction = {
        //     type: 'unshare-annotations',
        //     remoteAnnotationIds: [remoteAnnotationId],
        // }
        // await this.scheduleAction(action, {
        //     queueInteraction: options.queueInteraction ?? 'queue-and-await',
        // })
    }

    waitForSync: ContentSharingInterface['waitForSync'] = async () => {
        await this._executingPendingActions
        await this._processingUserMessage
    }

    async scheduleAction(
        action: ContentSharingAction,
        options: {
            queueInteraction: ContentSharingQueueInteraction
        },
    ) {
        await this._queingAction

        if (options.queueInteraction === 'skip-queue') {
            await this.executeAction(action)
            return
        }

        this._hasPendingActions = true
        this._queingAction = createResolvable()
        await this.storage.queueAction({ action })
        this._queingAction.resolve()
        delete this._queingAction

        const executePendingActions = this.executePendingActions()
        if (options.queueInteraction === 'queue-and-await') {
            await executePendingActions
        }
        executePendingActions.catch((e) => {
            console.error(
                `Error while executing action ${action.type} (retry scheduled):`,
            )
            console.error(e)
        })
    }

    executePendingActions = async () => {
        await this._executingPendingActions

        const executingPendingActions = (this._executingPendingActions = createResolvable())
        if (this._pendingActionsRetry) {
            this._pendingActionsRetry.resolve()
            delete this._pendingActionsRetry
        }

        try {
            while (true) {
                await this._queingAction

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
            this._scheduledRetry = async () => {
                delete this._scheduledRetry
                delete this._scheduledRetryTimeout
                await this.executePendingActions()
            }
            this._scheduledRetryTimeout = setTimeout(
                this._scheduledRetry,
                this.ACTION_RETRY_INTERVAL,
            )
            throw e
        } finally {
            delete this._executingPendingActions
        }
    }

    async forcePendingActionsRetry() {
        await this._scheduledRetry()
    }

    async executeAction(action: ContentSharingAction) {}

    async _scheduleAddAnnotationEntries(params: {
        annotations: Annotation[]
        remoteListIds: string[]
        queueInteraction: ContentSharingQueueInteraction
    }) {
        const annotationsByPageUrl: {
            [annotationUrl: string]: { pageUrl: string; createdWhen?: Date }
        } = fromPairs(
            params.annotations.map((annotation) => [
                annotation.url,
                annotation,
            ]),
        )
        const annotationMetadata = await this.storage.getRemoteAnnotationMetadata(
            {
                localIds: params.annotations.map(
                    (annotation) => annotation.url,
                ),
            },
        )
        const remoteAnnotations = Object.entries(annotationMetadata)
            .filter(([, metadata]) => !metadata.excludeFromLists)
            .map(([localId, { remoteId }]) => ({
                normalizedPageUrl: annotationsByPageUrl[localId].pageUrl,
                remoteId,
                createdWhen:
                    annotationsByPageUrl[localId].createdWhen?.getTime() ??
                    Date.now(),
            }))

        await this.scheduleAction(
            {
                type: 'add-annotation-entries',
                remoteListIds: params.remoteListIds,
                remoteAnnotations,
            },
            { queueInteraction: params.queueInteraction },
        )
    }

    async handlePostStorageChange(
        event: StorageOperationEvent<'post'>,
        options: {
            source: 'sync' | 'local'
        },
    ) {
        // if (options.source === 'sync' && !this.shouldProcessSyncChanges) {
        //     return
        // }
        for (const change of event.info.changes) {
            if (change.type === 'create') {
            } else if (change.type === 'modify') {
                if (change.collection === 'annotations') {
                    // await this._processModifiedAnnotation(change)
                }
            } else if (change.type === 'delete') {
                if (change.collection === 'pageListEntries') {
                    await this._processDeletedListEntryies(change)
                } else if (change.collection === 'annotations') {
                    // await this._processDeletedAnnotation(change)
                }
            }
        }
    }

    async _processModifiedAnnotation(
        change: ModificationStorageChange<'post'>,
    ) {
        if (!change.updates.comment) {
            return
        }

        const remoteAnnotationIds = await this.storage.getRemoteAnnotationIds({
            localIds: change.pks as string[],
        })
        if (!Object.keys(remoteAnnotationIds).length) {
            return
        }
        for (const [localAnnotationId, remoteAnnotationId] of Object.entries(
            remoteAnnotationIds,
        )) {
            await this.scheduleAction(
                {
                    type: 'update-annotation-comment',
                    localAnnotationId,
                    remoteAnnotationId: remoteAnnotationId as string,
                    updatedComment: change.updates.comment,
                },
                {
                    queueInteraction: 'queue-and-return',
                },
            )
        }
    }

    async _processDeletedListEntryies(change: DeletionStorageChange<'post'>) {
        for (const pk of change.pks) {
            const [, pageUrl] = pk as [number, string]
            this.remoteEmitter.emit('pageRemovedFromSharedList', {
                pageUrl,
            })
        }
    }

    async _processDeletedAnnotation(change: DeletionStorageChange<'post'>) {
        const localAnnotationIds = change.pks.map((pk) => pk.toString())
        const remoteAnnotationIdMap = await this.storage.getRemoteAnnotationIds(
            { localIds: localAnnotationIds },
        )
        if (!Object.keys(remoteAnnotationIdMap).length) {
            return
        }

        await this.scheduleAction(
            {
                type: 'unshare-annotations',
                remoteAnnotationIds: Object.values(remoteAnnotationIdMap),
            },
            {
                queueInteraction: 'queue-and-return',
            },
        )
    }

    _processUserMessage: UserMessageEvents['message'] = async (event) => {
        await this._processingUserMessage
        const processingUserMessage = createResolvable()
        this._processingUserMessage = processingUserMessage

        try {
            const { message } = event
            if (message.type === 'joined-collection') {
                await this._processJoinedCollection({
                    type: 'shared-list-reference',
                    id: message.sharedListId,
                })
            } else if (message.type === 'created-annotation') {
                await this._processCreatedAnnotation({
                    type: 'shared-annotation-reference',
                    id: message.sharedAnnotationId,
                })
            }
        } catch (e) {
            processingUserMessage.reject(e)
            throw e
        } finally {
            processingUserMessage.resolve()
            delete this._processUserMessage
        }
    }

    private async _processJoinedCollection(listReference: SharedListReference) {
        const { contentSharing } = await this.options.getServerStorage()
        const sharedList = await contentSharing.getListByReference(
            listReference,
        )
        if (!sharedList) {
            return // assume the list was deleted after the user joined it
        }
        const remoteId = listReference.id.toString()
        if (await this.storage.getLocalListId({ remoteId })) {
            return
        }

        const localId = Date.now()
        await this.storage.storeListId({
            localId,
            remoteId,
        })

        // TODO: What if there already exists a list with this name?
        await this.options.customLists.insertCustomList({
            id: localId,
            name: sharedList.title,
        })
    }

    private async _processCreatedAnnotation(
        reference: SharedAnnotationReference,
    ) {
        const { contentSharing } = await this.options.getServerStorage()
        const annotationDetails = await contentSharing.getAnnotation({
            reference,
        })
        if (!annotationDetails) {
            return // assume the annotation was deleted after the user created it
        }
        const { annotation } = annotationDetails

        const localId = annotationUtils.generateUrl({
            pageUrl: annotation.normalizedPageUrl,
            now: () => annotation.createdWhen,
        })

        await this.storage.storeAnnotationMetadata([
            {
                localId,
                remoteId: reference.id as string,
                excludeFromLists: false,
            },
        ])

        await this.options.annotationStorage.createAnnotation({
            url: localId,
            body: annotation.body,
            comment: annotation.comment,
            pageUrl: annotation.normalizedPageUrl,
            createdWhen: new Date(annotation.createdWhen),
        })
    }
}
