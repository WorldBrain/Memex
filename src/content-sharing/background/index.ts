import pick from 'lodash/pick'
import type StorageManager from '@worldbrain/storex'
import type { StorageOperationEvent } from '@worldbrain/storex-middleware-change-watcher/lib/types'
import type { ContentSharingBackend } from '@worldbrain/memex-common/lib/content-sharing/backend'
import {
    makeAnnotationPrivacyLevel,
    getAnnotationPrivacyState,
} from '@worldbrain/memex-common/lib/content-sharing/utils'
import type CustomListBG from 'src/custom-lists/background'
import type { AuthBackground } from 'src/authentication/background'
import type { Analytics } from 'src/analytics/types'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import { getNoteShareUrl } from 'src/content-sharing/utils'
import type { RemoteEventEmitter } from 'src/util/webextensionRPC'
import type ActivityStreamsBackground from 'src/activity-streams/background'
import type { Services } from 'src/services/types'
import type { ServerStorageModules } from 'src/storage/types'
import type { ContentSharingInterface, AnnotationSharingStates } from './types'
import { ContentSharingClientStorage } from './storage'
import type { GenerateServerID } from '../../background-script/types'
import AnnotationStorage from 'src/annotations/background/storage'
import { SharedListRoleID } from '@worldbrain/memex-common/lib/content-sharing/types'
import AnnotationSharingService from '@worldbrain/memex-common/lib/content-sharing/service/annotation-sharing'

export default class ContentSharingBackground {
    private annotationSharingService: AnnotationSharingService
    remoteFunctions: ContentSharingInterface
    storage: ContentSharingClientStorage

    _ensuredPages: { [normalizedUrl: string]: string } = {}

    constructor(
        public options: {
            storageManager: StorageManager
            backend: ContentSharingBackend
            customListsBG: CustomListBG
            annotations: AnnotationStorage
            auth: AuthBackground
            analytics: Analytics
            activityStreams: Pick<ActivityStreamsBackground, 'backend'>
            services: Pick<Services, 'contentSharing'>
            captureException?: (e: Error) => void
            remoteEmitter: RemoteEventEmitter<'contentSharing'>
            getServerStorage: () => Promise<
                Pick<ServerStorageModules, 'contentSharing'>
            >
            generateServerId: GenerateServerID
        },
    ) {
        this.storage = new ContentSharingClientStorage({
            storageManager: options.storageManager,
        })
        this.annotationSharingService = new AnnotationSharingService({
            storage: this.storage,
            generateServerId: options.generateServerId,
            addToListSuggestions: (listId) =>
                options.customListsBG.updateListSuggestionsCache({
                    added: listId,
                }),
            listStorage: {
                insertPageToList: (e) =>
                    options.customListsBG.storage.insertPageToList({
                        listId: e.listId,
                        pageUrl: e.normalizedPageUrl,
                        fullUrl: e.fullPageUrl,
                    }),
                getEntriesForPage: (normalizedPageUrl) =>
                    options.customListsBG.storage.fetchPageListEntriesByUrl({
                        normalizedPageUrl,
                    }),
            },
            annotationStorage: {
                getAnnotation: (annotationUrl) =>
                    options.annotations.getAnnotationByPk(annotationUrl),
                getAnnotations: (annotationUrls) =>
                    options.annotations.getAnnotations(annotationUrls),
                getEntriesForAnnotation: (url) =>
                    options.annotations.findListEntriesByUrl({ url }),
                getEntriesForAnnotations: (annotationUrls) =>
                    options.annotations.findListEntriesByUrls({
                        annotationUrls,
                    }),
                ensureAnnotationInList: (entry) =>
                    options.annotations.ensureAnnotInList({
                        listId: entry.listId,
                        url: entry.annotationUrl,
                    }),
                insertAnnotationToList: async (entry) =>
                    options.annotations.insertAnnotToList({
                        listId: entry.listId,
                        url: entry.annotationUrl,
                    }),
                removeAnnotationFromList: async (entry) =>
                    options.annotations.removeAnnotFromList({
                        listId: entry.listId,
                        url: entry.annotationUrl,
                    }),
            },
        })

        this.remoteFunctions = {
            ...options.services.contentSharing,
            shareList: this.shareList,
            shareAnnotation: this.shareAnnotation,
            shareAnnotations: this.shareAnnotations,
            executePendingActions: this.executePendingActions.bind(this),
            shareAnnotationsToAllLists: this.shareAnnotationsToAllLists,
            unshareAnnotationsFromAllLists: this.unshareAnnotationsFromAllLists,
            shareAnnotationToSomeLists: this.shareAnnotationToSomeLists,
            unshareAnnotationFromList: this.unshareAnnotationFromList,
            unshareAnnotations: this.unshareAnnotations,
            ensureRemotePageId: this.ensureRemotePageId,
            getRemoteAnnotationLink: this.getRemoteAnnotationLink,
            findAnnotationPrivacyLevels: this.findAnnotationPrivacyLevels.bind(
                this,
            ),
            setAnnotationPrivacyLevel: this.setAnnotationPrivacyLevel,
            deleteAnnotationPrivacyLevel: this.deleteAnnotationPrivacyLevel,
            generateRemoteAnnotationId: async () =>
                this.generateRemoteAnnotationId(),
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
            getAnnotationSharingState: this.getAnnotationSharingState,
            getAnnotationSharingStates: this.getAnnotationSharingStates,
            getAllRemoteLists: this.getAllRemoteLists,
            waitForSync: this.waitForSync,
            suggestSharedLists: this.suggestSharedLists,
            unshareAnnotation: this.unshareAnnotation,
            deleteAnnotationShare: this.deleteAnnotationShare,
            canWriteToSharedListRemoteId: this.canWriteToSharedListRemoteId,
            canWriteToSharedList: this.canWriteToSharedList,
        }
    }

    async setup() {}

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

    getAllRemoteLists: ContentSharingInterface['getAllRemoteLists'] = async () => {
        const remoteListIdsDict = await this.storage.getAllRemoteListIds()
        const remoteListData: Array<{
            localId: number
            remoteId: string
            name: string
        }> = []

        for (const localId of Object.keys(remoteListIdsDict).map(Number)) {
            const list = await this.options.customListsBG.storage.fetchListById(
                localId,
            )
            remoteListData.push({
                localId,
                remoteId: remoteListIdsDict[localId],
                name: list.name,
            })
        }

        return remoteListData
    }

    shareList: ContentSharingInterface['shareList'] = async (options) => {
        const existingRemoteId = await this.storage.getRemoteListId({
            localId: options.listId,
        })
        if (existingRemoteId) {
            return {
                remoteListId: existingRemoteId,
                annotationSharingStates: {},
            }
        }

        const localList = await this.options.customListsBG.storage.fetchListById(
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

        await this.options.analytics.trackEvent({
            category: 'ContentSharing',
            action: 'shareList',
        })

        const annotationSharingStates = await this.selectivelySharePrivateListAnnotations(
            options.listId,
        )

        return {
            remoteListId,
            annotationSharingStates,
        }
    }

    private async selectivelySharePrivateListAnnotations(
        listId: number,
    ): Promise<AnnotationSharingStates> {
        const { annotations: annotationsBG, customListsBG } = this.options

        const annotationEntries = await annotationsBG.findListEntriesByList({
            listId,
        })
        const sharingStates = await this.getAnnotationSharingStates({
            annotationUrls: annotationEntries.map((e) => e.url),
        })

        const annotationIds = new Set<string>(
            annotationEntries.map((e) => e.url),
        )

        // Ensure that all parent pages for annotations have a list entry
        const annotationsData = await annotationsBG.getAnnotations([
            ...annotationIds,
        ])
        const annotationParentPageIds = new Set<string>([
            ...annotationsData.map((a) => a.pageUrl),
        ])
        const parentPages = await this.storage.getPages({
            normalizedPageUrls: [...annotationParentPageIds],
        })
        for (const page of parentPages) {
            const existingPageListEntry = await customListsBG.storage.fetchListEntry(
                listId,
                page.normalizedUrl,
            )

            if (!existingPageListEntry) {
                await customListsBG.storage.insertPageToList({
                    pageUrl: page.normalizedUrl,
                    fullUrl: page.originalUrl,
                    listId,
                })
            }
        }

        const privateAnnotationIds = [...annotationIds].filter((url) =>
            [
                AnnotationPrivacyLevels.PRIVATE,
                AnnotationPrivacyLevels.PROTECTED,
            ].includes(sharingStates[url]?.privacyLevel),
        )

        await this.storage.storeAnnotationMetadata(
            privateAnnotationIds.map((localId) => {
                const remoteId = this.generateRemoteAnnotationId()
                sharingStates[localId].hasLink = true
                sharingStates[localId].remoteId = remoteId
                sharingStates[localId].privacyLevel =
                    AnnotationPrivacyLevels.PROTECTED

                return {
                    localId,
                    excludeFromLists: true,
                    remoteId,
                }
            }),
        )

        await this.storage.setAnnotationPrivacyLevelBulk({
            annotations: privateAnnotationIds,
            privacyLevel: AnnotationPrivacyLevels.PROTECTED,
        })

        for (const annotationId of privateAnnotationIds) {
            // NOTE: These 2 calls are not ideal (re-creating the list entry), though doing it to trigger a shared list entry
            //  creation on the server-side. Ideally it would trigger from one of the other data changes here.
            await annotationsBG.removeAnnotFromList({
                listId,
                url: annotationId,
            })
            await annotationsBG.insertAnnotToList({
                listId,
                url: annotationId,
            })
        }

        return sharingStates
    }

    shareAnnotation: ContentSharingInterface['shareAnnotation'] = async (
        options,
    ) => {
        const sharingState = await this.annotationSharingService.shareAnnotation(
            options,
        )
        return { sharingState, remoteId: sharingState.remoteId }
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
                excludeFromLists: !options.shareToLists ?? true,
            })),
        )

        await this.storage.setAnnotationPrivacyLevelBulk({
            annotations: nonProtectedAnnotations,
            privacyLevel: makeAnnotationPrivacyLevel({
                public: options.shareToLists,
                protected: options.setBulkShareProtected,
            }),
        })

        return { sharingStates: await this.getAnnotationSharingStates(options) }
    }

    shareAnnotationsToAllLists: ContentSharingInterface['shareAnnotationsToAllLists'] = async (
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

        return { sharingStates: await this.getAnnotationSharingStates(options) }
    }

    ensureRemotePageId: ContentSharingInterface['ensureRemotePageId'] = async (
        normalizedPageUrl,
    ) => {
        const userId = (await this.options.auth.authService.getCurrentUser())
            ?.id
        if (!userId) {
            throw new Error(
                `Tried to execute sharing action without being authenticated`,
            )
        }
        if (this._ensuredPages[normalizedPageUrl]) {
            return this._ensuredPages[normalizedPageUrl]
        }

        const userReference = {
            type: 'user-reference' as 'user-reference',
            id: userId,
        }

        const page = await this.storage.getPage(normalizedPageUrl)

        const { contentSharing } = await this.options.getServerStorage()
        const reference = await contentSharing.ensurePageInfo({
            pageInfo: pick(page, 'fullTitle', 'originalUrl', 'normalizedUrl'),
            creatorReference: userReference,
        })
        const id = contentSharing.getSharedPageInfoLinkID(reference)
        this._ensuredPages[normalizedPageUrl] = id
        return id
    }

    unshareAnnotationsFromAllLists: ContentSharingInterface['unshareAnnotationsFromAllLists'] = async (
        options,
    ) => {
        const sharingState = await this.annotationSharingService.removeAnnotationFromAllLists(
            {
                annotationUrl: options.annotationUrls[0],
                setBulkShareProtected: options.setBulkShareProtected,
            },
        )
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
            },
        )
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

        return { sharingStates: await this.getAnnotationSharingStates(options) }
    }

    unshareAnnotation: ContentSharingInterface['unshareAnnotation'] = async (
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

    // OLD direct linking method
    deleteAnnotationShare: ContentSharingInterface['deleteAnnotationShare'] = async (
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
        const sharingState = await this.annotationSharingService.setAnnotationPrivacyLevel(
            {
                annotationUrl: params.annotation,
                privacyLevel: params.privacyLevel,
                keepListsIfUnsharing: params.keepListsIfUnsharing,
            },
        )
        return { sharingState }
    }

    deleteAnnotationPrivacyLevel: ContentSharingInterface['deleteAnnotationPrivacyLevel'] = async (
        params,
    ) => {
        await this.storage.deleteAnnotationPrivacyLevel(params)
    }

    waitForSync: ContentSharingInterface['waitForSync'] = async () => {}

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

    suggestSharedLists: ContentSharingInterface['suggestSharedLists'] = async (
        params,
    ) => {
        const loweredPrefix = params.prefix.toLowerCase()
        const lists = await this.options.customListsBG.storage.fetchAllLists({
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

    canWriteToSharedListRemoteId: ContentSharingInterface['canWriteToSharedListRemoteId'] = async ({
        remoteId,
    }) => {
        // const remoteId = await this.storage.getRemoteListId({localId: params.localId,})
        const currentUser = await this.options.auth.authService.getCurrentUser()
        const storage = await this.options.getServerStorage()
        const listRole = await storage.contentSharing.getListRole({
            listReference: { type: 'shared-list-reference', id: remoteId },
            userReference: {
                type: 'user-reference',
                id: currentUser?.id,
            },
        })
        const canWrite = [
            SharedListRoleID.AddOnly,
            SharedListRoleID.ReadWrite,
            SharedListRoleID.Owner,
            SharedListRoleID.Admin,
        ].includes(listRole?.roleID)
        return canWrite
    }
    canWriteToSharedList: ContentSharingInterface['canWriteToSharedList'] = async (
        params,
    ) => {
        const remoteId = await this.storage.getRemoteListId({
            localId: params.localId,
        })
        return await this.canWriteToSharedListRemoteId({ remoteId })
    }

    async handlePostStorageChange(
        event: StorageOperationEvent<'post'>,
        options: {
            source: 'sync' | 'local'
        },
    ) {}
}
