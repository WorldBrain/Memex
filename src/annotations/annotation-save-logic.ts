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
    isBulkShareProtected?: boolean
} & ({ body: string; comment?: string } | { body?: string; comment: string })

interface AnnotationUpdateData {
    localId: string
    comment: string
    /** Denotes whether to share (true) or unshare (false). */
    shouldShare: boolean
    isBulkShareProtected?: boolean
}

export interface SaveAnnotationParams<
    T extends AnnotationCreateData | AnnotationUpdateData
> {
    annotationData: T
    annotationsBG: AnnotationInterface<'caller'>
    contentSharingBG: ContentSharingInterface
}

export interface SaveAnnotationReturnValue {
    remoteAnnotationLink?: string
    savePromise: Promise<void>
}

export async function createAnnotation({
    annotationData,
    annotationsBG,
    contentSharingBG,
}: SaveAnnotationParams<AnnotationCreateData>): Promise<
    SaveAnnotationReturnValue
> {
    let remoteAnnotationId: string
    if (annotationData.shouldShare) {
        remoteAnnotationId = await contentSharingBG.generateRemoteAnnotationId()
    }

    return {
        remoteAnnotationLink: getNoteShareUrl({ remoteAnnotationId }),
        savePromise: (async () => {
            const annotationUrl = await annotationsBG.createAnnotation({
                createdWhen: annotationData.createdWhen,
                pageUrl: annotationData.fullPageUrl,
                selector: annotationData.selector,
                title: annotationData.pageTitle,
                comment: annotationData.comment,
                body: annotationData.body,
            })

            await Promise.all([
                annotationData.shouldShare &&
                    contentSharingBG.shareAnnotation({
                        annotationUrl,
                        remoteAnnotationId,
                    }),
                annotationData.isBulkShareProtected &&
                    annotationsBG.updateAnnotationPrivacyLevel({
                        annotation: annotationUrl,
                        privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                    }),
            ])
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
        remoteAnnotationLink: getNoteShareUrl({ remoteAnnotationId }),
        savePromise: (async () => {
            await annotationsBG.editAnnotation(
                annotationData.localId,
                annotationData.comment,
            )

            await Promise.all([
                annotationData.shouldShare
                    ? contentSharingBG.shareAnnotation({
                          annotationUrl: annotationData.localId,
                          remoteAnnotationId,
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
        })(),
    }
}
