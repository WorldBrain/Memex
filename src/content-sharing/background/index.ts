import pick from 'lodash/pick'
import StorageManager from '@worldbrain/storex'
import { ContentSharingBackend } from '@worldbrain/memex-common/lib/content-sharing/backend'
import { ContentSharingInterface } from './types'
import { ContentSharingClientStorage } from './storage'
import CustomListStorage from 'src/custom-lists/background/storage'
import { AuthBackground } from 'src/authentication/background'
import { Analytics } from 'src/analytics/types'
import AnnotationStorage from 'src/annotations/background/storage'
import { AnnotationPrivacyLevels } from 'src/annotations/types'
import { getNoteShareUrl } from 'src/content-sharing/utils'
import { RemoteEventEmitter } from 'src/util/webextensionRPC'
import ActivityStreamsBackground from 'src/activity-streams/background'
import { Services } from 'src/services/types'
import { ServerStorageModules } from 'src/storage/types'
import { StorageOperationEvent } from '@worldbrain/storex-middleware-change-watcher/lib/types'

export default class ContentSharingBackground {
    remoteFunctions: ContentSharingInterface
    storage: ContentSharingClientStorage

    _ensuredPages: { [normalizedUrl: string]: string } = {}

    constructor(
        public options: {
            storageManager: StorageManager
            backend: ContentSharingBackend
            customLists: CustomListStorage
            annotationStorage: AnnotationStorage
            auth: AuthBackground
            analytics: Analytics
            activityStreams: Pick<ActivityStreamsBackground, 'backend'>
            services: Pick<Services, 'contentSharing'>
            captureException?: (e: Error) => void
            remoteEmitter: RemoteEventEmitter<'contentSharing'>
            getServerStorage: () => Promise<
                Pick<ServerStorageModules, 'contentSharing'>
            >
            generateServerId: (collectionName: string) => number | string
        },
    ) {
        this.storage = new ContentSharingClientStorage({
            storageManager: options.storageManager,
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
    }

    async setup() {}

    async executePendingActions() {}

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
        const existingRemoteId = await this.storage.getRemoteListId({
            localId: options.listId,
        })
        if (existingRemoteId) {
            return { remoteListId: existingRemoteId }
        }

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
        const allMetadata = await this.storage.getRemoteAnnotationMetadata({
            localIds: options.annotationUrls,
        })
        await this.storage.setAnnotationsExcludedFromLists({
            localIds: options.annotationUrls.filter(
                (url) => allMetadata[url]?.excludeFromLists,
            ),
            excludeFromLists: false,
        })
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

        const page = (
            await this.storage.getPages({
                normalizedPageUrls: [normalizedPageUrl],
            })
        )[normalizedPageUrl]
        const { contentSharing } = await this.options.getServerStorage()
        const reference = await contentSharing.ensurePageInfo({
            pageInfo: pick(page, 'fullTitle', 'originalUrl', 'normalizedUrl'),
            creatorReference: userReference,
        })
        const id = contentSharing.getSharedPageInfoLinkID(reference)
        this._ensuredPages[normalizedPageUrl] = id
        return id
    }

    unshareAnnotationsFromLists: ContentSharingInterface['unshareAnnotationsFromLists'] = async (
        options,
    ) => {
        const allMetadata = await this.storage.getRemoteAnnotationMetadata({
            localIds: options.annotationUrls,
        })
        await this.storage.setAnnotationsExcludedFromLists({
            localIds: options.annotationUrls.filter(
                (url) => !allMetadata[url]?.excludeFromLists,
            ),
            excludeFromLists: true,
        })
    }

    unshareAnnotation: ContentSharingInterface['unshareAnnotation'] = async (
        options,
    ) => {
        const remoteAnnotationId = (
            await this.storage.getRemoteAnnotationIds({
                localIds: [options.annotationUrl],
            })
        )[options.annotationUrl]
        if (!remoteAnnotationId) {
            throw new Error(
                `Tried to unshare an annotation which was not shared`,
            )
        }
        await this.storage.deleteAnnotationMetadata({
            localIds: [options.annotationUrl],
        })
    }

    waitForSync: ContentSharingInterface['waitForSync'] = async () => {}

    async handlePostStorageChange(
        event: StorageOperationEvent<'post'>,
        options: {
            source: 'sync' | 'local'
        },
    ) {}
}
