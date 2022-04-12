import { getNoteShareUrl } from 'src/content-sharing/utils'
import type { AnnotationInterface } from './background/types'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import type { Anchor } from 'src/highlighting/types'
import { copyToClipboard } from './content_script/utils'
import { shareOptsToPrivacyLvl } from './utils'

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
} & ({ body: string; comment?: string } | { body?: string; comment: string })

interface AnnotationUpdateData {
    localId: string
    comment: string
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
}

export interface SaveAnnotationReturnValue {
    remoteAnnotationLink: string | null
    savePromise: Promise<string>
}

// TODO: Allow this function to return the generated annotation URL before the Promise resolves
export async function createAnnotation({
    annotationData,
    annotationsBG,
    contentSharingBG,
    skipPageIndexing,
    shareOpts,
}: SaveAnnotationParams<AnnotationCreateData>): Promise<
    SaveAnnotationReturnValue
> {
    let remoteAnnotationId: string
    if (shareOpts?.shouldShare) {
        remoteAnnotationId = await contentSharingBG.generateRemoteAnnotationId()

        if (shareOpts.shouldCopyShareLink) {
            await copyToClipboard(getNoteShareUrl({ remoteAnnotationId }))
        }
    }

    return {
        remoteAnnotationLink: shareOpts?.shouldShare
            ? getNoteShareUrl({ remoteAnnotationId })
            : null,
        savePromise: (async () => {
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
                        .replace(/\\\)/g, ')')
                        .replace(/\    \n/g, '')
                        .replace(/\*   /g, ' * '),
                    body: annotationData.body,
                },
                { skipPageIndexing },
            )

            if (shareOpts?.shouldShare) {
                await contentSharingBG.shareAnnotation({
                    annotationUrl,
                    remoteAnnotationId,
                    shareToLists: true,
                    skipPrivacyLevelUpdate: true,
                })
            }

            await contentSharingBG.setAnnotationPrivacyLevel({
                annotation: annotationUrl,
                privacyLevel: shareOptsToPrivacyLvl(shareOpts),
            })

            return annotationUrl
        })(),
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
    let remoteAnnotationId: string
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
        remoteAnnotationLink: shareOpts?.shouldShare
            ? getNoteShareUrl({ remoteAnnotationId })
            : null,
        savePromise: (async () => {
            await annotationsBG.editAnnotation(
                annotationData.localId,
                annotationData.comment
                    .replace(/\\\[/g, '[')
                    .replace(/\\\]/g, ']')
                    .replace(/\\\(/g, '(')
                    .replace(/\\\)/g, ')')
                    .replace(/\    \n/g, '')
                    .replace(/\*   /g, ' * '),
            )

            await Promise.all([
                shareOpts?.shouldShare &&
                    contentSharingBG.shareAnnotation({
                        remoteAnnotationId,
                        annotationUrl: annotationData.localId,
                        shareToLists: true,
                        skipPrivacyLevelUpdate: true,
                    }),
                !shareOpts?.skipPrivacyLevelUpdate &&
                    contentSharingBG.setAnnotationPrivacyLevel({
                        annotation: annotationData.localId,
                        privacyLevel: shareOptsToPrivacyLvl(shareOpts),
                        keepListsIfUnsharing,
                    }),
            ])
            return annotationData.localId
        })(),
    }
}
