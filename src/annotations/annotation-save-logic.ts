import { getNoteShareUrl } from 'src/content-sharing/utils'
import type { AnnotationInterface } from './background/types'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import type { Anchor } from 'src/highlighting/types'
import { copyToClipboard } from './content_script/utils'
import { shareOptsToPrivacyLvl } from './utils'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import {
    SyncSettingsStore,
    createSyncSettingsStore,
} from 'src/sync-settings/util'
import type { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import { RGBAColor } from './cache/types'

export interface AnnotationShareOpts {
    shouldShare?: boolean
    shouldCopyShareLink?: boolean
    isBulkShareProtected?: boolean
    skipPrivacyLevelUpdate?: boolean
}

type AnnotationCreateData = {
    fullPageUrl: string
    pageTitle?: string
    localId?: string
    createdWhen?: Date
    selector?: Anchor
    localListIds?: number[]
    color?: RGBAColor | string | string
} & ({ body: string; comment?: string } | { body?: string; comment: string })

interface AnnotationUpdateData {
    localId: string
    body: string
    comment: string | null
    color?: RGBAColor | string | string
}

export interface SaveAnnotationParams<
    T extends AnnotationCreateData | AnnotationUpdateData
> {
    annotationData: T
    annotationsBG: AnnotationInterface<'caller'>
    contentSharingBG: ContentSharingInterface
    shareOpts?: AnnotationShareOpts
    skipPageIndexing?: boolean
    keepListsIfUnsharing?: boolean
    skipListExistenceCheck?: boolean
    privacyLevelOverride?: AnnotationPrivacyLevels
    syncSettingsBG?: RemoteSyncSettingsInterface
}

export interface SaveAnnotationReturnValue {
    remoteAnnotationId: string | null
    savePromise: Promise<string>
}

async function checkIfAutoCreateLink(
    syncSettingsBG: RemoteSyncSettingsInterface,
) {
    let syncSettings: SyncSettingsStore<'extension'>

    syncSettings = createSyncSettingsStore({
        syncSettingsBG: syncSettingsBG,
    })

    let existingSetting = await syncSettings.extension.get(
        'shouldAutoCreateNoteLink',
    )

    if (existingSetting == null) {
        await syncSettings.extension.set('shouldAutoCreateNoteLink', false)
        existingSetting = false
    }

    return existingSetting
}

export async function createAnnotation({
    annotationData,
    annotationsBG,
    contentSharingBG,
    syncSettingsBG,
    skipPageIndexing,
    skipListExistenceCheck,
    privacyLevelOverride,
    shareOpts,
}: SaveAnnotationParams<AnnotationCreateData>): Promise<
    SaveAnnotationReturnValue
> {
    const remoteAnnotationId = await contentSharingBG.generateRemoteAnnotationId()
    return {
        remoteAnnotationId,
        savePromise: (async () => {
            await contentSharingBG.waitForPageLinkCreation({
                fullPageUrl: annotationData.fullPageUrl,
            })
            const annotationUrl = await annotationsBG.createAnnotation(
                {
                    url: annotationData.localId,
                    createdWhen: annotationData.createdWhen,
                    pageUrl: annotationData.fullPageUrl,
                    selector: annotationData.selector,
                    title: annotationData.pageTitle,
                    comment: annotationData.comment
                        .replace(/\\\[/g, '[')
                        .replace(/\\\]/g, ']')
                        .replace(/\\\(/g, '(')
                        .replace(/\\\)/g, ')'),
                    body: annotationData.body,
                    color: annotationData.color,
                },
                { skipPageIndexing },
            )

            if (annotationData.localListIds?.length) {
                await contentSharingBG.shareAnnotationToSomeLists({
                    annotationUrl,
                    skipListExistenceCheck,
                    localListIds: annotationData.localListIds,
                })
            }

            let shareData = null
            if (shareOpts?.shouldCopyShareLink) {
                shareData = await contentSharingBG.shareAnnotation({
                    annotationUrl,
                    remoteAnnotationId,
                    shareToParentPageLists: shareOpts?.shouldShare ?? false,
                    skipPrivacyLevelUpdate: !!shareOpts?.shouldShare ?? true,
                })

                const baseUrl =
                    process.env.NODE_ENV === 'production'
                        ? 'https://memex.social'
                        : 'http://staging.memex.social'

                const link = baseUrl + '/a/' + shareData?.remoteId
                navigator.clipboard.writeText(link)
            } else if (shareOpts?.shouldShare) {
                shareData = await contentSharingBG.shareAnnotation({
                    annotationUrl,
                    remoteAnnotationId,
                    shareToParentPageLists: false,
                    skipPrivacyLevelUpdate: true,
                })
            }

            await contentSharingBG.setAnnotationPrivacyLevel({
                annotationUrl,
                privacyLevel:
                    privacyLevelOverride ?? shareOptsToPrivacyLvl(shareOpts),
            })

            if (shareData?.remoteId != null) {
                createAndCopyShareLink(
                    shareData?.remoteId,
                    annotationUrl,
                    contentSharingBG,
                    syncSettingsBG,
                )
            }

            return annotationUrl
        })(),
    }
}

async function createAndCopyShareLink(
    remoteAnnotationId,
    annotationUrl,
    contentSharingBG,
    syncSettingsBG,
) {
    let shouldCopyLink = await checkIfAutoCreateLink(syncSettingsBG)

    if (shouldCopyLink) {
        copyToClipboard(getNoteShareUrl({ remoteAnnotationId }))
    }
}

export async function updateAnnotation({
    annotationData,
    annotationsBG,
    contentSharingBG,
    shareOpts,
    keepListsIfUnsharing,
}: SaveAnnotationParams<AnnotationUpdateData>): Promise<
    SaveAnnotationReturnValue
> {
    let remoteAnnotationId: string = null
    if (shareOpts?.shouldShare) {
        const remoteAnnotMetadata = await contentSharingBG.getRemoteAnnotationMetadata(
            { annotationUrls: [annotationData.localId] },
        )

        remoteAnnotationId =
            (remoteAnnotMetadata[annotationData.localId]?.remoteId as string) ??
            (await contentSharingBG.generateRemoteAnnotationId())

        if (shareOpts.shouldCopyShareLink) {
            await copyToClipboard(getNoteShareUrl({ remoteAnnotationId }))
        }
    }

    return {
        remoteAnnotationId,
        savePromise: (async () => {
            if (annotationData.comment != null || annotationData.body != null) {
                await annotationsBG.editAnnotation(
                    annotationData.localId,
                    annotationData.comment
                        ? annotationData.comment
                              .replace(/\\\[/g, '[')
                              .replace(/\\\]/g, ']')
                              .replace(/\\\(/g, '(')
                              .replace(/\\\)/g, ')')
                        : null,
                    annotationData.color,
                    annotationData.body ?? null,
                )
            }

            await Promise.all([
                shareOpts?.shouldShare &&
                    contentSharingBG.shareAnnotation({
                        remoteAnnotationId,
                        annotationUrl: annotationData.localId,
                        shareToParentPageLists: true,
                    }),
                !shareOpts?.skipPrivacyLevelUpdate &&
                    contentSharingBG.setAnnotationPrivacyLevel({
                        annotationUrl: annotationData.localId,
                        privacyLevel: shareOptsToPrivacyLvl(shareOpts),
                        keepListsIfUnsharing,
                    }),
            ])

            return annotationData.localId
        })(),
    }
}
