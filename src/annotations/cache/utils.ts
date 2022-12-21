import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { PageList } from 'src/custom-lists/background/types'
import type { Annotation } from '../types'
import type {
    UnifiedAnnotation,
    UnifiedAnnotationForCache,
    UnifiedList,
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

export const reshapeListForCache = (
    list: PageList,
    suppData: {
        creator?: UserReference
        extraData?: any
    },
): Omit<UnifiedList, 'unifiedId'> => ({
    name: list.name,
    localId: list.id,
    remoteId: list.remoteId,
    creator: suppData.creator,
    description: list.description,
    unifiedAnnotationIds: [],
    ...(suppData.extraData ?? {}),
})
