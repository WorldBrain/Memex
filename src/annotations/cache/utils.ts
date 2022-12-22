import type { FollowedList } from 'src/page-activity-indicator/background/types'
import type { PageList } from 'src/custom-lists/background/types'
import type { Annotation } from '../types'
import type {
    UnifiedAnnotation,
    UnifiedAnnotationForCache,
    UnifiedList,
    UnifiedListForCache,
} from './types'
import { shareOptsToPrivacyLvl } from '../utils'

export const reshapeAnnotationForCache = (
    annot: Annotation,
    opts: {
        extraData?: Partial<UnifiedAnnotation>
        excludeLocalLists?: boolean
        unifiedListIds?: string[]
    },
): UnifiedAnnotationForCache => {
    const createdWhen = annot.createdWhen?.getTime()
    if (createdWhen == null) {
        throw new Error(
            'Cannot reshape annotation missing createdWhen timestamp',
        )
    }
    return {
        localId: annot.url,
        unifiedListIds: opts.unifiedListIds ?? [],
        body: annot.body,
        comment: annot.comment,
        selector: annot.selector,
        creator: opts.extraData?.creator,
        localListIds: opts.excludeLocalLists ? undefined : annot.lists,
        normalizedPageUrl: annot.pageUrl,
        lastEdited: annot.lastEdited?.getTime() ?? createdWhen,
        createdWhen,
        privacyLevel: shareOptsToPrivacyLvl({
            shouldShare: annot.isShared,
            isBulkShareProtected: annot.isBulkShareProtected,
        }),
        ...(opts.extraData ?? {}),
    }
}

// export const reshapeCacheAnnotation = (
//     annot: UnifiedAnnotation & Required<Pick<UnifiedAnnotation, 'localId'>>,
// ): Annotation => ({
//     url: annot.localId,
//     pageUrl: annot.normalizedPageUrl,
//     body: annot.body,
//     comment: annot.comment,
//     selector: annot.selector,
//     isShared: annot.isShared,
//     isBulkShareProtected: annot.isBulkShareProtected,
//     lastEdited: new Date(annot.lastEdited),
//     createdWhen: new Date(annot.createdWhen),
//     lists: [],
//     tags: [],
// })

export const reshapeLocalListForCache = (
    list: PageList,
    opts: {
        extraData?: Partial<UnifiedList>
    },
): UnifiedListForCache => ({
    name: list.name,
    localId: list.id,
    remoteId: list.remoteId,
    creator: opts.extraData?.creator,
    description: list.description,
    unifiedAnnotationIds: [],
    ...(opts.extraData ?? {}),
})

export const reshapeFollowedListForCache = (
    list: FollowedList,
    opts: {
        extraData?: Partial<UnifiedList>
    },
): UnifiedListForCache => ({
    name: list.name,
    localId: undefined,
    remoteId: list.sharedList.toString(),
    creator: { type: 'user-reference', id: list.creator },
    description: undefined,
    unifiedAnnotationIds: [],
    ...(opts.extraData ?? {}),
})
