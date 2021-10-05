import { getNoteShareUrl } from 'src/content-sharing/utils'
import { AnnotationPrivacyLevels } from './types'
import type { AnnotationInterface } from './background/types'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import type { Anchor } from 'src/highlighting/types'

type AnnotationCreateData = {
    fullPageUrl: string
    pageTitle?: string
    createdWhen?: Date
    selector?: Anchor
    shouldShare?: boolean
    shouldShareToList?: boolean
    isBulkShareProtected?: boolean
} & ({ body: string; comment?: string } | { body?: string; comment: string })

interface AnnotationUpdateData {
    localId: string
    comment: string
    /** Denotes whether to share (true) or unshare (false). */
    shouldShare: boolean
    shouldShareToList?: boolean
    isBulkShareProtected?: boolean
}

export interface SaveAnnotationParams<
    T extends AnnotationCreateData | AnnotationUpdateData
> {
    annotationData: T
    annotationsBG: AnnotationInterface<'caller'>
    contentSharingBG: ContentSharingInterface
    skipPageIndexing?: boolean
    /** Note this overwrites the default save remote endpoint call. Return the annotation ID (URL). */
    customSaveCb?: () => Promise<string>
}

export interface SaveAnnotationReturnValue {
    remoteAnnotationLink: string | null
    savePromise: Promise<string>
}

export async function createAnnotation({
    annotationData,
    annotationsBG,
    contentSharingBG,
    skipPageIndexing,
    customSaveCb,
}: SaveAnnotationParams<AnnotationCreateData>): Promise<
    SaveAnnotationReturnValue
> {
    let remoteAnnotationId: string
    if (annotationData.shouldShare) {
        remoteAnnotationId = await contentSharingBG.generateRemoteAnnotationId()
    }

    return {
        remoteAnnotationLink: annotationData.shouldShare
            ? getNoteShareUrl({ remoteAnnotationId })
            : null,
        savePromise: (async () => {
            const annotationUrl = await (customSaveCb?.() ??
                annotationsBG.createAnnotation(
                    {
                        createdWhen: annotationData.createdWhen,
                        pageUrl: annotationData.fullPageUrl,
                        selector: annotationData.selector,
                        title: annotationData.pageTitle,
                        comment: annotationData.comment,
                        body: annotationData.body,
                        isBulkShareProtected:
                            annotationData.isBulkShareProtected,
                    },
                    { skipPageIndexing },
                ))

            if (annotationData.shouldShare) {
                await contentSharingBG.shareAnnotation({
                    annotationUrl,
                    remoteAnnotationId,
                    shareToLists: annotationData.shouldShareToList,
                })
            }

            return annotationUrl
        })(),
    }
}

export async function updateAnnotation({
    annotationData,
    annotationsBG,
    contentSharingBG,
}: SaveAnnotationParams<AnnotationUpdateData>): Promise<
    SaveAnnotationReturnValue
> {
    let remoteAnnotationId: string
    if (annotationData.shouldShare) {
        remoteAnnotationId = await contentSharingBG.generateRemoteAnnotationId()
    }

    return {
        remoteAnnotationLink: annotationData.shouldShare
            ? getNoteShareUrl({ remoteAnnotationId })
            : null,
        savePromise: (async () => {
            await annotationsBG.editAnnotation(
                annotationData.localId,
                annotationData.comment,
            )

            await Promise.all([
                annotationData.shouldShare
                    ? contentSharingBG.shareAnnotation({
                          remoteAnnotationId,
                          annotationUrl: annotationData.localId,
                          shareToLists: annotationData.shouldShareToList,
                      })
                    : contentSharingBG.unshareAnnotation({
                          annotationUrl: annotationData.localId,
                      }),
                annotationData.isBulkShareProtected &&
                    annotationsBG.updateAnnotationPrivacyLevel({
                        annotation: annotationData.localId,
                        privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                    }),
            ])
            return annotationData.localId
        })(),
    }
}
