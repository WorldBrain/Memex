import pick from 'lodash/pick'
import type StorageManager from '@worldbrain/storex'
import type { StorageOperationEvent } from '@worldbrain/storex-middleware-change-watcher/lib/types'
import type { ContentSharingBackend } from '@worldbrain/memex-common/lib/content-sharing/backend'
import {
    makeAnnotationPrivacyLevel,
    getAnnotationPrivacyState,
    maybeGetAnnotationPrivacyState,
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
import type {
    ContentSharingInterface,
    AnnotationSharingState,
    AnnotationSharingStates,
} from './types'
import { ContentSharingClientStorage } from './storage'
import type { GenerateServerID } from '../../background-script/types'
import AnnotationStorage from 'src/annotations/background/storage'
import { SharedListRoleID } from '@worldbrain/memex-common/lib/content-sharing/types'
import { AnnotListEntry, Annotation } from 'src/annotations/types'

export default class ContentSharingBackground {
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
        const sharingState =
            options.sharingState ??
            (await this.getAnnotationSharingState(options))
        sharingState.hasLink = true
        if (!sharingState.remoteId) {
            sharingState.remoteId =
                options.remoteAnnotationId ?? this.generateRemoteAnnotationId()
            await this.storage.storeAnnotationMetadata([
                {
                    localId: options.annotationUrl,
                    excludeFromLists: !options.shareToLists ?? true,
                    remoteId: sharingState.remoteId,
                },
            ])
        }

        if (options.shareToLists) {
            const annotation = await this.options.annotations.getAnnotationByPk(
                options.annotationUrl,
            )

            sharingState.sharedListIds = await this.fetchSharedListIdsForPage(
                annotation.pageUrl,
            )
        } else {
            const annotationEntries = await this.options.annotations.findListEntriesByUrl(
                { url: options.annotationUrl },
            )
            const remoteListIds = await this.storage.getRemoteListIds({
                localIds: annotationEntries.map((e) => e.listId),
            })
            sharingState.sharedListIds = []
            sharingState.privateListIds = []
            annotationEntries.forEach((e) => {
                if (remoteListIds[e.listId] != null) {
                    sharingState.sharedListIds.push(e.listId)
                } else {
                    sharingState.privateListIds.push(e.listId)
                }
            })
        }

        if (!options.skipPrivacyLevelUpdate) {
            const privacyLevel = makeAnnotationPrivacyLevel({
                public: options.shareToLists,
                protected: options.setBulkShareProtected,
            })
            await this.storage.setAnnotationPrivacyLevel({
                annotation: options.annotationUrl,
                privacyLevel,
            })
            sharingState.privacyLevel = privacyLevel
        }

        this.options.analytics.trackEvent({
            category: 'ContentSharing',
            action: 'shareAnnotation',
        })

        return { remoteId: sharingState.remoteId, sharingState }
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
        const { annotations: annotationsBG } = this.options
        const privacyLevel = options.setBulkShareProtected
            ? AnnotationPrivacyLevels.PROTECTED
            : AnnotationPrivacyLevels.PRIVATE

        const sharingStates = await this.getAnnotationSharingStates({
            annotationUrls: options.annotationUrls,
        })

        for (const annotationUrl of options.annotationUrls) {
            if (sharingStates[annotationUrl] == null) {
                sharingStates[annotationUrl] = {
                    privacyLevel,
                    hasLink: false,
                    sharedListIds: [],
                    privateListIds: [],
                }
                continue
            }

            // Remove annotation only from shared lists
            for (const listId of sharingStates[annotationUrl].sharedListIds) {
                await annotationsBG.removeAnnotFromList({
                    listId,
                    url: annotationUrl,
                })
            }

            sharingStates[annotationUrl].sharedListIds = []
            sharingStates[annotationUrl].privacyLevel = privacyLevel
        }

        const allMetadata = await this.storage.getRemoteAnnotationMetadata({
            localIds: options.annotationUrls,
        })
        await this.storage.setAnnotationsExcludedFromLists({
            localIds: options.annotationUrls.filter(
                (url) => !allMetadata[url]?.excludeFromLists,
            ),
            excludeFromLists: true,
        })
        await this.storage.setAnnotationPrivacyLevelBulk({
            annotations: options.annotationUrls,
            privacyLevel,
        })

        // As the annotation will be going from public (implicit list entries, following parent page) to private (explicit list entries),
        //  we need to ensure the remaining, non-shared lists entries exist in the DB
        for (const annotationUrl of options.annotationUrls) {
            for (const listId of sharingStates[annotationUrl]?.privateListIds ??
                []) {
                await annotationsBG.ensureAnnotInList({
                    listId,
                    url: annotationUrl,
                })
            }
        }

        return { sharingStates }
    }

    shareAnnotationToSomeLists: ContentSharingInterface['shareAnnotationToSomeLists'] = async (
        options,
    ) => {
        const { annotations: annotationsBG, customListsBG } = this.options

        for (const listId of options.localListIds) {
            await customListsBG.updateListSuggestionsCache({
                added: listId,
            })
        }

        const [annotation, sharingState] = await Promise.all([
            annotationsBG.getAnnotationByPk(options.annotationUrl),
            this.getAnnotationSharingState(options),
        ])
        const privacyState = getAnnotationPrivacyState(
            sharingState.privacyLevel,
        )

        const pageListEntryIds = await customListsBG.storage.fetchListIdsByUrl(
            annotation.pageUrl,
        )
        const remoteListIds = await this.storage.getRemoteListIds({
            localIds: [
                ...new Set([...pageListEntryIds, ...options.localListIds]),
            ],
        })

        // We can skip a few writes if all of the lists to add to are private
        const processPrivateListsOnly = options.localListIds.reduce(
            (prev, curr) => remoteListIds[curr] == null && prev,
            true,
        )

        // In these cases we are making the annotation "selectively shared"
        if (
            !processPrivateListsOnly &&
            (!privacyState.public || options.protectAnnotation)
        ) {
            sharingState.privacyLevel = AnnotationPrivacyLevels.PROTECTED
            await this.storage.setAnnotationPrivacyLevel({
                annotation: options.annotationUrl,
                privacyLevel: sharingState.privacyLevel,
            })
        }

        // If making a public annotation "selectively shared", we need to ensure parent page lists are inherited
        if (privacyState.public && options.protectAnnotation) {
            await this.storage.setAnnotationsExcludedFromLists({
                localIds: [options.annotationUrl],
                excludeFromLists: true,
            })

            for (const listId of pageListEntryIds) {
                if (remoteListIds[listId] == null) {
                    continue
                }
                await annotationsBG.ensureAnnotInList({
                    listId,
                    url: options.annotationUrl,
                })
            }
        }

        if (!processPrivateListsOnly && !sharingState.remoteId) {
            const { remoteId } = await this.shareAnnotation({
                annotationUrl: options.annotationUrl,
                shareToLists: privacyState.public,
                skipPrivacyLevelUpdate: true,
                sharingState,
            })
            sharingState.remoteId = remoteId
            sharingState.hasLink = true
        }

        const page = await this.storage.getPage(annotation.pageUrl)

        for (const listId of options.localListIds) {
            if (
                [
                    ...sharingState.privateListIds,
                    ...sharingState.sharedListIds,
                ].includes(listId)
            ) {
                continue
            }

            // If list is private, add current annotation to it and move straight on
            if (remoteListIds[listId] == null) {
                await annotationsBG.ensureAnnotInList({
                    listId,
                    url: options.annotationUrl,
                })
                sharingState.privateListIds.push(listId)
                continue
            }

            if (!pageListEntryIds.includes(listId) && page != null) {
                await customListsBG.storage.insertPageToList({
                    listId,
                    pageUrl: annotation.pageUrl,
                    fullUrl: page.originalUrl,
                })
            }

            if (!privacyState.public || options.protectAnnotation) {
                await annotationsBG.insertAnnotToList({
                    listId,
                    url: options.annotationUrl,
                })
            }

            sharingState.sharedListIds.push(listId)
        }
        return { sharingState }
    }

    unshareAnnotationFromList: ContentSharingInterface['unshareAnnotationFromList'] = async (
        options,
    ) => {
        const { annotations: annotationsBG, customListsBG } = this.options

        const sharingState = await this.getAnnotationSharingState({
            annotationUrl: options.annotationUrl,
        })

        const excludeList = (id: number) => id !== options.localListId
        sharingState.privateListIds = sharingState.privateListIds.filter(
            excludeList,
        )
        sharingState.sharedListIds = sharingState.sharedListIds.filter(
            excludeList,
        )

        const privacyState = getAnnotationPrivacyState(
            sharingState.privacyLevel,
        )

        const remoteListId = await this.storage.getRemoteListId({
            localId: options.localListId,
        })

        if (!privacyState.public || remoteListId == null) {
            await annotationsBG.removeAnnotFromList({
                listId: options.localListId,
                url: options.annotationUrl,
            })

            return { sharingState }
        }

        const annotation = await annotationsBG.getAnnotationByPk(
            options.annotationUrl,
        )

        // If we get here, we're making a public annotation "selectively shared"
        sharingState.privacyLevel = AnnotationPrivacyLevels.PROTECTED
        await this.storage.setAnnotationPrivacyLevel({
            annotation: options.annotationUrl,
            privacyLevel: AnnotationPrivacyLevels.PROTECTED,
        })
        await this.storage.setAnnotationsExcludedFromLists({
            localIds: [options.annotationUrl],
            excludeFromLists: true,
        })

        const pageListEntryIds = await customListsBG.storage.fetchListIdsByUrl(
            annotation.pageUrl,
        )
        const remoteListIds = await this.storage.getRemoteListIds({
            localIds: pageListEntryIds,
        })

        for (const listId of pageListEntryIds) {
            if (
                listId === options.localListId ||
                remoteListIds[listId] == null
            ) {
                continue
            }

            await annotationsBG.ensureAnnotInList({
                listId,
                url: options.annotationUrl,
            })
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
        if (
            params.privacyLevel === AnnotationPrivacyLevels.SHARED ||
            params.privacyLevel === AnnotationPrivacyLevels.SHARED_PROTECTED
        ) {
            // Annot becoming public
            const sharingState = await this.getAnnotationSharingState({
                annotationUrl: params.annotation,
            })

            // Remove all shared list entries, as public annots inherit them from parent page
            for (const listId of sharingState.sharedListIds) {
                await this.options.annotations.removeAnnotFromList({
                    listId,
                    url: params.annotation,
                })
            }
            await this.storage.setAnnotationsExcludedFromLists({
                localIds: [params.annotation],
                excludeFromLists: false,
            })

            return this.shareAnnotation({
                annotationUrl: params.annotation,
                setBulkShareProtected:
                    params.privacyLevel ===
                    AnnotationPrivacyLevels.SHARED_PROTECTED,
                shareToLists: true,
                sharingState,
            })
        } else if (params.keepListsIfUnsharing) {
            // Annot becoming "selectively shared"
            const sharingState = await this.getAnnotationSharingState({
                annotationUrl: params.annotation,
            })

            // Explicitly set all shared list entries, as they will no longer be inherited from parent page
            for (const listId of sharingState.sharedListIds) {
                await this.options.annotations.ensureAnnotInList({
                    listId,
                    url: params.annotation,
                })
            }
            await this.storage.setAnnotationsExcludedFromLists({
                localIds: [params.annotation],
                excludeFromLists: true,
            })

            sharingState.privacyLevel = AnnotationPrivacyLevels.PROTECTED
            await this.storage.setAnnotationPrivacyLevel({
                annotation: params.annotation,
                privacyLevel: AnnotationPrivacyLevels.PROTECTED,
            })

            return { sharingState }
        } else {
            // Annot becoming private, not keeping lists
            const { sharingStates } = await this.unshareAnnotationsFromAllLists(
                {
                    annotationUrls: [params.annotation],
                    setBulkShareProtected:
                        params.privacyLevel ===
                        AnnotationPrivacyLevels.PROTECTED,
                },
            )
            return { sharingState: sharingStates[params.annotation] }
        }
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
        const { annotations: annotationsBG } = this.options

        const privacyLevel = await this.storage.findAnnotationPrivacyLevel({
            annotation: params.annotationUrl,
        })
        const privacyState = maybeGetAnnotationPrivacyState(
            privacyLevel?.privacyLevel,
        )

        const [annotation, annotationEntries, remoteId] = await Promise.all<
            Annotation,
            AnnotListEntry[],
            string | number
        >([
            privacyState.public
                ? annotationsBG.getAnnotationByPk(params.annotationUrl)
                : Promise.resolve(null),
            annotationsBG.findListEntriesByUrl({
                url: params.annotationUrl,
            }),
            this.storage.getRemoteAnnotationId({
                localId: params.annotationUrl,
            }),
        ])

        const remoteListIds = await this.storage.getRemoteListIds({
            localIds: annotationEntries.map((e) => e.listId),
        })

        const sharedListIds = new Set<number>()
        const privateListIds = new Set<number>()
        annotationEntries.forEach((entry) => {
            if (remoteListIds[entry.listId] != null) {
                sharedListIds.add(entry.listId)
            } else {
                privateListIds.add(entry.listId)
            }
        })

        if (privacyState.public) {
            const pageListIds = await this.fetchSharedListIdsForPage(
                annotation.pageUrl,
            )
            pageListIds.forEach((listId) => sharedListIds.add(listId))
        }

        return {
            hasLink: !!remoteId,
            remoteId: remoteId ?? undefined,
            sharedListIds: [...sharedListIds],
            privateListIds: [...privateListIds],
            privacyLevel:
                privacyLevel?.privacyLevel ?? AnnotationPrivacyLevels.PRIVATE,
        }
    }

    getAnnotationSharingStates: ContentSharingInterface['getAnnotationSharingStates'] = async (
        params,
    ) => {
        const { annotations: annotationsBG } = this.options

        // TODO: Optimize, this should only take 3 queries, not 3 * annotationCount
        const states: AnnotationSharingStates = {}

        const [privacyLevels, remoteAnnotIds] = await Promise.all([
            this.storage.getPrivacyLevelsByAnnotation({
                annotations: params.annotationUrls,
            }),
            this.storage.getRemoteAnnotationIds({
                localIds: params.annotationUrls,
            }),
        ])

        const privateAnnotationUrls = new Set<string>()
        const publicAnnotationUrls = new Set<string>()
        for (const annotationUrl in privacyLevels) {
            const privacyLevel = privacyLevels[annotationUrl]
            const privacyState = maybeGetAnnotationPrivacyState(
                privacyLevel?.privacyLevel,
            )

            if (privacyState.public) {
                publicAnnotationUrls.add(annotationUrl)
            } else {
                privateAnnotationUrls.add(annotationUrl)
            }
        }

        const [publicAnnotations, annotationEntries] = await Promise.all([
            annotationsBG.getAnnotations([...publicAnnotationUrls]),
            annotationsBG.findListEntriesByUrls(params),
        ])
        const listIds = new Set<number>()
        for (const entries of Object.values(annotationEntries)) {
            entries.forEach((e) => listIds.add(e.listId))
        }
        const remoteListIds = await this.storage.getRemoteListIds({
            localIds: [...listIds],
        })

        const getListIds = (
            annotationUrl: string,
            type: 'shared' | 'private',
        ): number[] => {
            return (
                annotationEntries[annotationUrl]?.map((e) => e.listId) ?? []
            ).filter((listId) =>
                type === 'shared'
                    ? remoteListIds[listId] != null
                    : remoteListIds[listId] == null,
            )
        }

        for (const annotationUrl of privateAnnotationUrls) {
            states[annotationUrl] = {
                remoteId: remoteAnnotIds[annotationUrl],
                hasLink: !!remoteAnnotIds[annotationUrl],
                sharedListIds: getListIds(annotationUrl, 'shared'),
                privateListIds: getListIds(annotationUrl, 'private'),
                privacyLevel:
                    privacyLevels[annotationUrl]?.privacyLevel ??
                    AnnotationPrivacyLevels.PRIVATE,
            }
        }

        const localListIdsByPageUrl = new Map<string, number[]>()
        for (const annotation of publicAnnotations) {
            let localListIds = localListIdsByPageUrl.get(annotation.pageUrl)

            // If not null, we've already processed another annotation with the same pageUrl
            if (localListIds == null) {
                localListIds = await this.fetchSharedListIdsForPage(
                    annotation.pageUrl,
                )
                localListIdsByPageUrl.set(annotation.pageUrl, localListIds)
            }

            const localListIdsSet = new Set([
                ...getListIds(annotation.url, 'shared'),
                ...localListIds,
            ])

            states[annotation.url] = {
                remoteId: remoteAnnotIds[annotation.url],
                hasLink: !!remoteAnnotIds[annotation.url],
                sharedListIds: [...localListIds],
                privateListIds: getListIds(annotation.url, 'private'),
                privacyLevel:
                    privacyLevels[annotation.url]?.privacyLevel ??
                    AnnotationPrivacyLevels.PRIVATE,
            }
        }

        return states
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

    private async fetchSharedListIdsForPage(
        pageUrl: string,
    ): Promise<number[]> {
        const pageListIds = await this.options.customListsBG.storage.fetchListIdsByUrl(
            pageUrl,
        )
        const remoteListIds = await this.storage.getRemoteListIds({
            localIds: pageListIds,
        })
        return pageListIds.filter((listId) => remoteListIds[listId] != null)
    }
}
