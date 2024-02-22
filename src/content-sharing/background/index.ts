import pick from 'lodash/pick'
import type StorageManager from '@worldbrain/storex'
import type { StorageOperationEvent } from '@worldbrain/storex-middleware-change-watcher/lib/types'
import type { ContentSharingBackend } from '@worldbrain/memex-common/lib/content-sharing/backend'
import {
    makeAnnotationPrivacyLevel,
    getAnnotationPrivacyState,
    createPageLinkListTitle,
    getListShareUrl,
} from '@worldbrain/memex-common/lib/content-sharing/utils'
import type { Analytics } from 'src/analytics/types'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import { getNoteShareUrl } from 'src/content-sharing/utils'
import {
    makeRemotelyCallable,
    RemoteEventEmitter,
} from 'src/util/webextensionRPC'
import type { Services } from 'src/services/types'
import type { ServerStorageModules } from 'src/storage/types'
import type {
    AnnotationSharingStates,
    ContentSharingInterface,
    CreatedPageLinkDetails,
    RemoteContentSharingByTabsInterface,
    __DeprecatedContentSharingInterface,
} from './types'
import { ContentSharingClientStorage } from './storage'
import type { GenerateServerID } from '../../background-script/types'
import { SharedListRoleID } from '@worldbrain/memex-common/lib/content-sharing/types'
import AnnotationSharingService from '@worldbrain/memex-common/lib/content-sharing/service/annotation-sharing'
import ListSharingService from '@worldbrain/memex-common/lib/content-sharing/service/list-sharing'
import type { BrowserSettingsStore } from 'src/util/settings'
import type { BackgroundModules } from 'src/background-script/setup'
import { SharedCollectionType } from '@worldbrain/memex-common/lib/content-sharing/storage/types'
import { deleteListTreeAndAllAssociatedData } from '@worldbrain/memex-common/lib/content-sharing/storage/delete-tree'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import {
    trackPageLinkCreate,
    trackSharedAnnotation,
    trackSpaceCreate,
    trackUnSharedAnnotation,
} from '@worldbrain/memex-common/lib/analytics/events'
import type { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import type { ListTree } from 'src/custom-lists/background/types'
import { COLLECTION_NAMES as LIST_COLL_NAMES } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import { LIST_TREE_OPERATION_ALIASES } from '@worldbrain/memex-common/lib/content-sharing/storage/list-tree-middleware'
import type { OperationBatch } from '@worldbrain/storex'
import { Resolvable, resolvablePromise } from 'src/util/resolvable'

export interface LocalContentSharingSettings {
    remotePageIdLookup: {
        [normalizedUrl: string]: { remoteId: string; asOf: number }
    }
}

export default class ContentSharingBackground {
    static ONE_WEEK_MS = 604800000

    private pageLinkCreationResolvable: Resolvable<void> | null = null
    private listSharePromises: {
        [localListId: number]: Promise<void>
    } = {}
    private listShareAnnotationSharePromises: {
        [localListId: number]: Promise<AnnotationSharingStates>
    } = {}
    private annotationSharingService: AnnotationSharingService
    private listSharingService: ListSharingService
    remoteFunctionsByTab: RemoteContentSharingByTabsInterface<'provider'>
    remoteFunctions: ContentSharingInterface
    storage: ContentSharingClientStorage

    constructor(
        public options: {
            storageManager: StorageManager
            backend: ContentSharingBackend
            analytics: Analytics
            analyticsBG: AnalyticsCoreInterface
            services: Pick<Services, 'contentSharing'>
            remoteEmitter: RemoteEventEmitter<'contentSharing'>
            contentSharingSettingsStore: BrowserSettingsStore<
                LocalContentSharingSettings
            >
            getBgModules: () => Pick<
                BackgroundModules,
                | 'auth'
                | 'pages'
                | 'customLists'
                | 'directLinking'
                | 'pageActivityIndicator'
            >
            captureException?: (e: Error) => void
            serverStorage: Pick<ServerStorageModules, 'contentSharing'>
            generateServerId: GenerateServerID
            waitForSync: () => Promise<void>
        },
    ) {
        this.storage = new ContentSharingClientStorage({
            storageManager: options.storageManager,
        })
        this.annotationSharingService = new AnnotationSharingService({
            storage: this.storage,
            generateServerId: options.generateServerId,
            addToListSuggestions: (listId) =>
                options.getBgModules().customLists.updateListSuggestionsCache({
                    added: listId,
                }),
            listStorage: {
                insertPageToList: (e) =>
                    options
                        .getBgModules()
                        .customLists.storage.insertPageToList({
                            listId: e.listId,
                            pageUrl: e.normalizedPageUrl,
                            fullUrl: e.fullPageUrl,
                        }),
                getEntriesForPage: (normalizedPageUrl) =>
                    options
                        .getBgModules()
                        .customLists.storage.fetchPageListEntriesByUrl({
                            normalizedPageUrl,
                        }),
            },
            annotationStorage: {
                getAnnotation: (annotationUrl) =>
                    options
                        .getBgModules()
                        .directLinking.annotationStorage.getAnnotationByPk({
                            url: annotationUrl,
                        }),
                getAnnotations: (annotationUrls) =>
                    options
                        .getBgModules()
                        .directLinking.annotationStorage.getAnnotations(
                            annotationUrls,
                        ),
                getEntriesForAnnotation: (url) =>
                    options
                        .getBgModules()
                        .directLinking.annotationStorage.findListEntriesByUrl({
                            url,
                        }),
                getEntriesForAnnotations: (annotationUrls) =>
                    options
                        .getBgModules()
                        .directLinking.annotationStorage.findListEntriesByUrls({
                            annotationUrls,
                        }),
                ensureAnnotationInList: (entry, opts) =>
                    options
                        .getBgModules()
                        .directLinking.annotationStorage.ensureAnnotInList(
                            {
                                listId: entry.listId,
                                url: entry.annotationUrl,
                            },
                            opts,
                        ),
                insertAnnotationToList: async (entry, opts) =>
                    options
                        .getBgModules()
                        .directLinking.annotationStorage.insertAnnotToList(
                            {
                                listId: entry.listId,
                                url: entry.annotationUrl,
                            },
                            opts,
                        ),
                removeAnnotationFromList: async (entry) =>
                    options
                        .getBgModules()
                        .directLinking.annotationStorage.removeAnnotFromList({
                            listId: entry.listId,
                            url: entry.annotationUrl,
                        }),
            },
        })

        this.listSharingService = new ListSharingService({
            storage: this.storage,
            waitForSync: options.waitForSync,
            generateServerId: options.generateServerId,
            listKeysService: options.services.contentSharing,
            annotationSharingService: this.annotationSharingService,
            listStorage: {
                getList: (listId) =>
                    options
                        .getBgModules()
                        .customLists.storage.fetchListById(listId),
                getListEntriesForPages: ({ listId, normalizedPageUrls }) =>
                    options
                        .getBgModules()
                        .customLists.storage.fetchListPageEntriesByUrls({
                            listId,
                            normalizedPageUrls,
                        }),
                insertPageToList: ({
                    listId,
                    fullPageUrl,
                    normalizedPageUrl,
                }) =>
                    options
                        .getBgModules()
                        .customLists.storage.insertPageToList({
                            listId,
                            fullUrl: fullPageUrl,
                            pageUrl: normalizedPageUrl,
                            isShared: true,
                        }),
            },
            annotationStorage: {
                getAnnotations: (annotationUrls) =>
                    options
                        .getBgModules()
                        .directLinking.annotationStorage.getAnnotations(
                            annotationUrls,
                        ),
                getEntriesByList: (listId) =>
                    options
                        .getBgModules()
                        .directLinking.annotationStorage.findListEntriesByList({
                            listId,
                        }),
                insertAnnotationToList: async (entry) =>
                    options
                        .getBgModules()
                        .directLinking.annotationStorage.insertAnnotToList({
                            listId: entry.listId,
                            url: entry.annotationUrl,
                        }),
                removeAnnotationFromList: async (entry) =>
                    options
                        .getBgModules()
                        .directLinking.annotationStorage.removeAnnotFromList({
                            listId: entry.listId,
                            url: entry.annotationUrl,
                        }),
            },
        })

        this.remoteFunctionsByTab = {
            schedulePageLinkCreation: this.schedulePageLinkCreation,
        }

        this.remoteFunctions = {
            waitForPageLinkCreation: this.waitForPageLinkCreation,
            getExistingKeyLinksForList: async (...args) => {
                const { contentSharing } = await options.services
                return contentSharing.getExistingKeyLinksForList(...args)
            },
            deleteKeyLink: async (...args) => {
                const { contentSharing } = await options.services
                return contentSharing.deleteKeyLink(...args)
            },
            scheduleListShare: this.scheduleListShare,
            waitForListShare: this.waitForListShare,
            deleteListAndAllAssociatedData: this.deleteListAndAllAssociatedData,
            shareAnnotation: this.shareAnnotation,
            shareAnnotations: this.shareAnnotations,
            executePendingActions: this.executePendingActions.bind(this),
            shareAnnotationToSomeLists: this.shareAnnotationToSomeLists,
            unshareAnnotationFromList: this.unshareAnnotationFromList,
            unshareAnnotations: this.unshareAnnotations,
            ensureRemotePageId: this.ensureRemotePageId,
            getRemoteAnnotationLink: this.getRemoteAnnotationLink,
            findAnnotationPrivacyLevels: this.findAnnotationPrivacyLevels.bind(
                this,
            ),
            setAnnotationPrivacyLevel: this.setAnnotationPrivacyLevel,
            generateRemoteAnnotationId: async () =>
                this.generateRemoteAnnotationId(),
            getRemoteListId: async (callOptions) => {
                return this.storage.getRemoteListId({
                    localId: callOptions.localListId,
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
            getListShareMetadata: this.getListShareMetadata,
            updateListPrivacy: async (params) => {
                return this.storage.updateListPrivacy({
                    localId: params.localListId,
                    private: params.isPrivate,
                })
            },
            getAnnotationSharingState: this.getAnnotationSharingState,
            fetchLocalListDataByRemoteId: this.fetchLocalListDataByRemoteId,
            getAnnotationSharingStates: this.getAnnotationSharingStates,
            createListEmailInvite: (params) =>
                this.options.backend.createListEmailInvite(params),
            deleteListEmailInvite: (params) =>
                this.options.backend.deleteListEmailInvite(params),
            acceptListEmailInvite: (params) =>
                this.options.backend.acceptListEmailInvite(params),
            loadListEmailInvites: (params) =>
                this.options.backend.loadListEmailInvites(params),
            // The following are all old RPCs that aren't used anymore, though their implementations still exist
            // shareAnnotationsToAllLists: this.shareAnnotationsToAllLists,
            // unshareAnnotationsFromAllLists: this.unshareAnnotationsFromAllLists,
            // areListsShared: async (callOptions) => {
            //     return this.storage.areListsShared({
            //         localIds: callOptions.localListIds,
            //     })
            // },
            // deleteAnnotationPrivacyLevel: this.deleteAnnotationPrivacyLevel,
            // getAllRemoteLists: this.getAllRemoteLists,
            // waitForSync: this.waitForSync,
            // suggestSharedLists: this.suggestSharedLists,
            // unshareAnnotation: this.unshareAnnotation,
            // deleteAnnotationShare: this.deleteAnnotationShare,
            // canWriteToSharedListRemoteId: this.canWriteToSharedListRemoteId,
            // canWriteToSharedList: this.canWriteToSharedList,
        }
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctionsByTab, {
            insertExtraArg: true,
        })
    }

    async executePendingActions() {}

    private generateRemoteAnnotationId = (): string =>
        this.options.generateServerId('sharedAnnotation').toString()

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

    getAllRemoteLists: __DeprecatedContentSharingInterface['getAllRemoteLists'] = async () => {
        const remoteListIdsDict = await this.storage.getAllRemoteListIds()
        const remoteListData: Array<{
            localId: number
            remoteId: string
            name: string
        }> = []

        for (const localId of Object.keys(remoteListIdsDict).map(Number)) {
            const list = await this.options
                .getBgModules()
                .customLists.storage.fetchListById(localId)
            remoteListData.push({
                localId,
                remoteId: remoteListIdsDict[localId],
                name: list.name,
            })
        }

        return remoteListData
    }

    fetchLocalListDataByRemoteId: ContentSharingInterface['fetchLocalListDataByRemoteId'] = async ({
        remoteListId,
    }) => {
        const sharedListMetaData = (
            await this.storage.getRemoteListShareMetadata({
                remoteListId: remoteListId,
            })
        )?.localId

        return sharedListMetaData
    }

    deleteListAndAllAssociatedData: ContentSharingInterface['deleteListAndAllAssociatedData'] = async ({
        localListId,
    }) => {
        // This will get caught by the ListTreeMiddleware
        await this.options.storageManager.operation(
            LIST_TREE_OPERATION_ALIASES.deleteTree,
            LIST_COLL_NAMES.listTrees,
            { localListId },
        )
    }

    performDeleteListAndAllAssociatedData: ContentSharingInterface['deleteListAndAllAssociatedData'] = async ({
        localListId,
    }) => {
        const { customLists } = this.options.getBgModules()

        await deleteListTreeAndAllAssociatedData({
            storageManager: this.options.storageManager,
            getAllNodesInTree: async () => {
                const listTrees = await customLists.storage.getAllNodesInTreeByList(
                    {
                        rootLocalListId: localListId,
                    },
                )
                const remoteListIds = await this.storage.getRemoteListIds({
                    localIds: listTrees
                        .filter((tree) => tree.listId != null)
                        .map((tree) => tree.listId!),
                })
                return listTrees.map((tree) => ({
                    ...tree,
                    remoteListId: remoteListIds[tree.listId!] ?? null,
                }))
            },
        })
    }

    scheduleListShare: ContentSharingInterface['scheduleListShare'] = async ({
        isPrivate,
        localListId,
        ...preGeneratedIds
    }) => {
        if (this.listSharePromises[localListId]) {
            throw new Error(
                `This list is already in the process of being shared - try calling "waitForListShare" RPC method`,
            )
        }

        const remoteListId =
            preGeneratedIds.remoteListId ??
            this.options.generateServerId('sharedList').toString()
        const collabKey =
            preGeneratedIds.collabKey ??
            this.options.generateServerId('sharedListKey').toString()

        const annotationLocalToRemoteIdsDict = await this.listSharingService.ensureRemoteAnnotationIdsExistForList(
            localListId,
        )

        this.listSharePromises[localListId] = this.performListShare({
            collabKey,
            isPrivate,
            localListId,
            remoteListId,
            annotationLocalToRemoteIdsDict,
        })

        return {
            collabKey,
            remoteListId,
            annotationLocalToRemoteIdsDict,
            links: [
                {
                    roleID: SharedListRoleID.Commenter,
                    link: getListShareUrl({
                        remoteListId,
                    }),
                },
                {
                    keyString: collabKey,
                    roleID: SharedListRoleID.ReadWrite,
                    link: getListShareUrl({
                        remoteListId,
                        collaborationKey: collabKey,
                    }),
                },
            ],
        }
    }

    waitForListShare: ContentSharingInterface['waitForListShare'] = async ({
        localListId,
    }) => {
        const promise = this.listSharePromises[localListId]
        delete this.listSharePromises[localListId]
        return promise
    }

    private async performListShare(options: {
        remoteListId: string
        localListId: number
        collabKey: string
        dontTrack?: boolean
        isPrivate?: boolean
        annotationLocalToRemoteIdsDict: { [localId: string]: AutoPk }
    }): Promise<void> {
        const {
            annotationSharingStatesPromise,
        } = await this.listSharingService.shareList(options)

        // NOTE: Currently we don't wait for the annotationsSharingStatesPromise, letting list annotations
        //  get shared asyncronously. If we wanted some UI loading state, we'd need to set up another remote
        //  method to wait for it.
        this.listShareAnnotationSharePromises[
            options.localListId
        ] = annotationSharingStatesPromise

        if (this.options.analyticsBG && options.dontTrack == null) {
            try {
                await trackSpaceCreate(this.options.analyticsBG, {
                    type: 'shared',
                })
            } catch (error) {
                console.error(`Error tracking space share event', ${error}`)
            }
        }
    }

    shareAnnotation: ContentSharingInterface['shareAnnotation'] = async (
        options,
    ) => {
        return this.annotationSharingService.shareAnnotation(options)
    }

    shareAnnotations: ContentSharingInterface['shareAnnotations'] = async (
        options,
    ) => {
        const remoteIds = await this.storage.getRemoteAnnotationIds({
            localIds: options.annotationUrls,
        })
        const annotPrivacyLevels = await this.storage.getPrivacyLevelsByAnnotation(
            { annotations: options.annotationUrls },
        )
        const nonProtectedAnnotations = options.annotationUrls.filter(
            (url) =>
                ![
                    AnnotationPrivacyLevels.PROTECTED,
                    AnnotationPrivacyLevels.SHARED_PROTECTED,
                ].includes(annotPrivacyLevels[url]?.privacyLevel),
        )

        await this.storage.storeAnnotationMetadata(
            nonProtectedAnnotations.map((localId) => ({
                localId,
                remoteId:
                    remoteIds[localId] ?? this.generateRemoteAnnotationId(),
                excludeFromLists: !options.shareToParentPageLists ?? true,
            })),
        )

        await this.storage.setAnnotationPrivacyLevelBulk({
            annotations: nonProtectedAnnotations,
            privacyLevel: makeAnnotationPrivacyLevel({
                public: options.shareToParentPageLists,
                protected: options.setBulkShareProtected,
            }),
        })

        if (this.options.analyticsBG) {
            try {
                await trackSharedAnnotation(this.options.analyticsBG, {
                    type: 'bulk',
                })
            } catch (error) {
                console.error(`Error tracking space create event', ${error}`)
            }
        }

        return { sharingStates: await this.getAnnotationSharingStates(options) }
    }

    shareAnnotationsToAllLists: __DeprecatedContentSharingInterface['shareAnnotationsToAllLists'] = async (
        options,
    ) => {
        const allMetadata = await this.storage.getRemoteAnnotationMetadata({
            localIds: options.annotationUrls,
        })
        const nonPublicAnnotations = options.annotationUrls.filter(
            (url) => allMetadata[url]?.excludeFromLists,
        )
        await this.storage.setAnnotationsExcludedFromLists({
            localIds: nonPublicAnnotations,
            excludeFromLists: false,
        })
        await this.storage.setAnnotationPrivacyLevelBulk({
            annotations: nonPublicAnnotations,
            privacyLevel: AnnotationPrivacyLevels.SHARED,
        })

        if (this.options.analyticsBG) {
            try {
                await trackSharedAnnotation(this.options.analyticsBG, {
                    type: 'autoShared',
                })
            } catch (error) {
                console.error(
                    `Error tracking autoshare annotation event'', ${error}`,
                )
            }
        }

        return { sharingStates: await this.getAnnotationSharingStates(options) }
    }

    private async getRemotePageIdLookupCache(): Promise<
        LocalContentSharingSettings['remotePageIdLookup']
    > {
        const lookupCache = await this.options.contentSharingSettingsStore.get(
            'remotePageIdLookup',
        )
        return lookupCache ?? {}
    }

    private async cacheRemotePageId(
        normalizedPageUrl: string,
        remoteId: string,
    ): Promise<void> {
        const lookupCache = await this.getRemotePageIdLookupCache()

        await this.options.contentSharingSettingsStore.set(
            'remotePageIdLookup',
            {
                ...lookupCache,
                [normalizedPageUrl]: { remoteId, asOf: Date.now() },
            },
        )
    }

    private async lookupRemotePageIdInCache(
        normalizedPageUrl: string,
    ): Promise<string | null> {
        const lookupCache = await this.getRemotePageIdLookupCache()
        const contents = lookupCache[normalizedPageUrl]
        if (
            !contents ||
            Date.now() - contents.asOf > ContentSharingBackground.ONE_WEEK_MS
        ) {
            return null
        }

        return contents?.remoteId
    }

    ensureRemotePageId: ContentSharingInterface['ensureRemotePageId'] = async (
        normalizedPageUrl,
    ) => {
        const userId = (
            await this.options.getBgModules().auth.authService.getCurrentUser()
        )?.id
        if (!userId) {
            throw new Error(
                `Tried to execute sharing action without being authenticated`,
            )
        }

        let remotePageId = await this.lookupRemotePageIdInCache(
            normalizedPageUrl,
        )
        if (remotePageId != null) {
            return remotePageId
        }

        const userReference = {
            type: 'user-reference' as 'user-reference',
            id: userId,
        }

        const page = await this.storage.getPage(normalizedPageUrl)
        if (page == null) {
            throw new Error(
                'No local page data exists for the given normalized page URL',
            )
        }

        const { contentSharing } = this.options.serverStorage
        const reference = await contentSharing.ensurePageInfo({
            pageInfo: pick(page, 'fullTitle', 'originalUrl', 'normalizedUrl'),
            creatorReference: userReference,
        })
        remotePageId = contentSharing.getSharedPageInfoLinkID(reference)
        await this.cacheRemotePageId(normalizedPageUrl, remotePageId)
        return remotePageId
    }

    unshareAnnotationsFromAllLists: __DeprecatedContentSharingInterface['unshareAnnotationsFromAllLists'] = async (
        options,
    ) => {
        const sharingState = await this.annotationSharingService.removeAnnotationFromAllLists(
            {
                annotationUrl: options.annotationUrls[0],
                setBulkShareProtected: options.setBulkShareProtected,
            },
        )

        if (this.options.analyticsBG) {
            try {
                await trackUnSharedAnnotation(this.options.analyticsBG, {
                    type: 'autoShared',
                })
            } catch (error) {
                console.error(
                    `Error tracking unshare autoshared annotation event', ${error}`,
                )
            }
        }
        return { sharingStates: { [options.annotationUrls[0]]: sharingState } }
    }

    shareAnnotationToSomeLists: ContentSharingInterface['shareAnnotationToSomeLists'] = async (
        options,
    ) => {
        const sharingState = await this.annotationSharingService.addAnnotationToLists(
            {
                annotationUrl: options.annotationUrl,
                listIds: options.localListIds,
                protectAnnotation: options.protectAnnotation,
                skipListExistenceCheck: options.skipListExistenceCheck,
            },
        )
        if (this.options.analyticsBG) {
            try {
                await trackSharedAnnotation(this.options.analyticsBG, {
                    type: 'shared',
                })
            } catch (error) {
                console.error(
                    `Error tracking nshare annotation to some lists event', ${error}`,
                )
            }
        }
        return { sharingState }
    }

    unshareAnnotationFromList: ContentSharingInterface['unshareAnnotationFromList'] = async (
        options,
    ) => {
        const sharingState = await this.annotationSharingService.removeAnnotationFromList(
            {
                annotationUrl: options.annotationUrl,
                listId: options.localListId,
            },
        )
        if (this.options.analyticsBG) {
            try {
                await trackUnSharedAnnotation(this.options.analyticsBG, {
                    type: 'shared',
                })
            } catch (error) {
                console.error(
                    `Error tracking unshare annotation to some lists event', ${error}`,
                )
            }
        }
        return { sharingState }
    }

    unshareAnnotations: ContentSharingInterface['unshareAnnotations'] = async (
        options,
    ) => {
        const annotPrivacyLevels = await this.storage.getPrivacyLevelsByAnnotation(
            { annotations: options.annotationUrls },
        )
        const nonProtectedAnnotations = options.annotationUrls.filter(
            (annotationUrl) =>
                ![
                    AnnotationPrivacyLevels.PROTECTED,
                    AnnotationPrivacyLevels.SHARED_PROTECTED,
                ].includes(annotPrivacyLevels[annotationUrl]?.privacyLevel),
        )

        const allMetadata = await this.storage.getRemoteAnnotationMetadata({
            localIds: nonProtectedAnnotations,
        })
        await this.storage.setAnnotationsExcludedFromLists({
            localIds: Object.values(allMetadata)
                .filter((metadata) => !metadata.excludeFromLists)
                .map(({ localId }) => localId),
            excludeFromLists: true,
        })

        await this.storage.setAnnotationPrivacyLevelBulk({
            annotations: nonProtectedAnnotations,
            privacyLevel: options.setBulkShareProtected
                ? AnnotationPrivacyLevels.PROTECTED
                : AnnotationPrivacyLevels.PRIVATE,
        })

        if (this.options.analyticsBG) {
            try {
                await trackUnSharedAnnotation(this.options.analyticsBG, {
                    type: 'bulk',
                })
            } catch (error) {
                console.error(`Error tracking space create event', ${error}`)
            }
        }

        return { sharingStates: await this.getAnnotationSharingStates(options) }
    }

    unshareAnnotation: __DeprecatedContentSharingInterface['unshareAnnotation'] = async (
        options,
    ) => {
        const privacyLevelObject = await this.storage.findAnnotationPrivacyLevel(
            { annotation: options.annotationUrl },
        )
        let privacyLevel =
            privacyLevelObject?.privacyLevel ?? AnnotationPrivacyLevels.PRIVATE
        const privacyState = getAnnotationPrivacyState(privacyLevel)
        await this.storage.deleteAnnotationMetadata({
            localIds: [options.annotationUrl],
        })
        if (privacyState.public) {
            privacyLevel = AnnotationPrivacyLevels.PRIVATE
            await this.storage.setAnnotationPrivacyLevel({
                annotation: options.annotationUrl,
                privacyLevel,
            })
        }
        return {
            sharingState: {
                hasLink: false,
                privateListIds: [],
                sharedListIds: [],
                privacyLevel,
            },
        }
    }

    getListShareMetadata: ContentSharingInterface['getListShareMetadata'] = async (
        params,
    ) => {
        return this.storage.getListShareMetadata({
            localIds: params.localListIds,
        })
    }

    // OLD direct linking method
    deleteAnnotationShare: __DeprecatedContentSharingInterface['deleteAnnotationShare'] = async (
        options,
    ) => {
        await this.storage.deleteAnnotationMetadata({
            localIds: [options.annotationUrl],
        })
        await this.storage.deleteAnnotationPrivacyLevel({
            annotation: options.annotationUrl,
        })
    }

    findAnnotationPrivacyLevels: ContentSharingInterface['findAnnotationPrivacyLevels'] = async (
        params,
    ) => {
        const storedLevels = await this.storage.getPrivacyLevelsByAnnotation({
            annotations: params.annotationUrls,
        })

        const privacyLevels = {}
        for (const annotationUrl of params.annotationUrls) {
            privacyLevels[annotationUrl] =
                storedLevels[annotationUrl]?.privacyLevel ??
                AnnotationPrivacyLevels.PRIVATE
        }
        return privacyLevels
    }

    setAnnotationPrivacyLevel: ContentSharingInterface['setAnnotationPrivacyLevel'] = async (
        params,
    ) => {
        if (
            params.privacyLevel === AnnotationPrivacyLevels.SHARED ||
            params.privacyLevel === AnnotationPrivacyLevels.SHARED_PROTECTED
        ) {
            if (this.options.analyticsBG) {
                try {
                    await trackSharedAnnotation(this.options.analyticsBG, {
                        type: 'autoShared',
                    })
                } catch (error) {
                    console.error(
                        `Error tracking space create event', ${error}`,
                    )
                }
            }
        }

        return this.annotationSharingService.setAnnotationPrivacyLevel(params)
    }

    deleteAnnotationPrivacyLevel: __DeprecatedContentSharingInterface['deleteAnnotationPrivacyLevel'] = async (
        params,
    ) => {
        await this.storage.deleteAnnotationPrivacyLevel(params)
    }

    getAnnotationSharingState: ContentSharingInterface['getAnnotationSharingState'] = async (
        params,
    ) => {
        return this.annotationSharingService.getAnnotationSharingState(params)
    }

    getAnnotationSharingStates: ContentSharingInterface['getAnnotationSharingStates'] = async (
        params,
    ) => {
        return this.annotationSharingService.getAnnotationSharingStates(params)
    }

    suggestSharedLists: __DeprecatedContentSharingInterface['suggestSharedLists'] = async (
        params,
    ) => {
        const loweredPrefix = params.prefix.toLowerCase()
        const lists = await this.options
            .getBgModules()
            .customLists.storage.fetchAllLists({
                limit: 10000,
                skip: 0,
            })
        const remoteIds = await this.storage.getAllRemoteListIds()
        const suggestions: Array<{
            localId: number
            name: string
            remoteId: string
            createdAt: number
        }> = []
        for (const list of lists) {
            if (
                remoteIds[list.id] &&
                list.name.toLowerCase().startsWith(loweredPrefix)
            ) {
                suggestions.push({
                    localId: list.id,
                    name: list.name,
                    remoteId: remoteIds[list.id],
                    createdAt: list.createdAt.getTime(),
                })
            }
        }
        return suggestions
    }

    async handlePostStorageChange(
        event: StorageOperationEvent<'post'>,
        options: {
            source: 'sync' | 'local'
        },
    ) {}

    waitForPageLinkCreation: ContentSharingInterface['waitForPageLinkCreation'] = async () => {
        await this.pageLinkCreationResolvable
    }

    scheduleManyPageLinkCreations = async (params: {
        fullPageUrls: Set<string>
        now?: number
    }): Promise<{ [fullPageUrl: string]: CreatedPageLinkDetails }> => {
        const now = params.now ?? Date.now()
        const bgModules = this.options.getBgModules()
        const currentUser = await bgModules.auth.authService.getCurrentUser()
        if (!currentUser) {
            throw new Error('Page links cannot be created when logged out')
        }

        const pageLinks: { [fullPageUrl: string]: CreatedPageLinkDetails } = {}
        const creationPromises: Promise<void>[] = []

        let localListIdCounter = now
        for (const fullPageUrl of params.fullPageUrls) {
            const localListId = localListIdCounter++
            const listTitle = createPageLinkListTitle(new Date(now))
            const remoteListId = this.options
                .generateServerId('sharedList')
                .toString()
            const remoteListEntryId = this.options
                .generateServerId('sharedListEntry')
                .toString()
            const collabKey = this.options
                .generateServerId('sharedListKey')
                .toString()

            pageLinks[fullPageUrl] = {
                collabKey,
                listTitle,
                localListId,
                remoteListId,
                remoteListEntryId,
            }

            // TODO: Do something with these Promises. Currently thrown into the wind of the JS event loop
            creationPromises.push(
                this.performPageLinkCreation({
                    creator: currentUser.id,
                    collabKey,
                    listTitle,
                    localListId,
                    remoteListEntryId,
                    remoteListId,
                    skipPageIndexing: true,
                    fullPageUrl,
                    now,
                }),
            )
        }

        return pageLinks
    }

    schedulePageLinkCreation: RemoteContentSharingByTabsInterface<
        'provider'
    >['schedulePageLinkCreation'] = async (
        { tab },
        { fullPageUrl, now = Date.now(), customPageTitle, skipPageIndexing },
    ) => {
        if (this.pageLinkCreationResolvable) {
            throw new Error(
                `Page link already in process of being created - try calling "waitForPageLink" RPC method`,
            )
        }
        this.pageLinkCreationResolvable = resolvablePromise()

        const bgModules = this.options.getBgModules()
        const currentUser = await bgModules.auth.authService.getCurrentUser()
        if (!currentUser) {
            throw new Error('Page links cannot be created when logged out')
        }

        const localListId = now
        const listTitle = createPageLinkListTitle(new Date(now))
        const remoteListId = this.options
            .generateServerId('sharedList')
            .toString()
        const remoteListEntryId = this.options
            .generateServerId('sharedListEntry')
            .toString()
        const collabKey = this.options
            .generateServerId('sharedListKey')
            .toString()
        const pageTitle = customPageTitle

        // Start but don't wait for the storage logic
        this.performPageLinkCreation({
            creator: currentUser.id,
            collabKey,
            listTitle,
            localListId,
            remoteListEntryId,
            remoteListId,
            tabId: tab?.id,
            skipPageIndexing,
            fullPageUrl,
            now,
            pageTitle,
        }).catch((err) => {
            this.pageLinkCreationResolvable.reject(err)
            this.pageLinkCreationResolvable = null
        })

        return {
            remoteListId,
            remoteListEntryId,
            listTitle,
            localListId,
            collabKey,
            pageTitle,
        }
    }

    private async performPageLinkCreation({
        remoteListEntryId,
        remoteListId,
        localListId,
        fullPageUrl,
        listTitle,
        collabKey,
        creator,
        tabId,
        now,
        pageTitle: customPageTitle,
        skipPageIndexing,
    }: Awaited<
        ReturnType<
            RemoteContentSharingByTabsInterface<
                'provider'
            >['schedulePageLinkCreation']
        >
    > & {
        fullPageUrl: string
        creator: string
        skipPageIndexing?: boolean
        tabId?: number
        now?: number
    }): Promise<void> {
        const bgModules = this.options.getBgModules()

        // Create all the local data needed for a page link
        if (!skipPageIndexing) {
            await bgModules.pages.indexPage(
                {
                    fullUrl: fullPageUrl,
                    visitTime: now,
                    tabId,
                    metaData: {
                        pageTitle: customPageTitle,
                    },
                },
                { addInboxEntryOnCreate: false },
            )
        }

        let pageTitle: string

        if (customPageTitle) {
            pageTitle = customPageTitle
        } else {
            pageTitle = await bgModules.pages.lookupPageTitleForUrl({
                fullPageUrl,
            })
        }
        await bgModules.customLists.createCustomList({
            id: localListId,
            name: listTitle,
            createdAt: new Date(now),
            dontTrack: true,
            type: 'page-link',
            remoteListId,
            collabKey,
        })
        await this.waitForListShare({ localListId })
        await bgModules.customLists.insertPageToList({
            id: localListId,
            url: fullPageUrl,
            createdAt: new Date(now),
            skipPageIndexing: true,
            suppressInboxEntry: true,
            suppressVisitCreation: true,
            pageTitle,
            dontTrack: true,
        })

        // NOTE: These calls to create followList and followedListEntry docs should trigger personal cloud sync upload
        await bgModules.pageActivityIndicator.createFollowedList(
            {
                creator,
                name: listTitle,
                sharedList: remoteListId,
                type: SharedCollectionType.PageLink,
            },
            { invokeCloudSync: true },
        )
        await bgModules.pageActivityIndicator.createFollowedListEntry(
            {
                creator,
                normalizedPageUrl: normalizeUrl(fullPageUrl),
                entryTitle: pageTitle,
                followedList: remoteListId,
                hasAnnotationsFromOthers: false,
                sharedListEntry: remoteListEntryId,
                createdWhen: now,
                updatedWhen: now,
            },
            { invokeCloudSync: true },
        )

        await this.options.backend.processListKey({
            type: SharedCollectionType.PageLink,
            allowOwnKeyProcessing: true,
            listId: remoteListId,
            keyString: collabKey.toString(),
        })

        this.pageLinkCreationResolvable?.resolve()
        this.pageLinkCreationResolvable = null

        if (this.options.analyticsBG) {
            try {
                await trackPageLinkCreate(this.options.analyticsBG, {
                    source: 'extension',
                })
            } catch (error) {
                console.error(`Error tracking space create event', ${error}`)
            }
        }
    }
}
