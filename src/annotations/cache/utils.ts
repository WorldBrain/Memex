import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { PageList } from 'src/custom-lists/background/types'
import type { Annotation } from '../types'
import type { UnifiedAnnotation, UnifiedList } from './types'

export const reshapeAnnotationForCache = (
    annot: Annotation,
    suppData: { creator?: UserReference },
): Omit<UnifiedAnnotation, 'unifiedId'> &
    Partial<Pick<UnifiedAnnotation, 'unifiedId'>> => {
    const createdWhen = annot.createdWhen?.getTime()
    if (createdWhen == null) {
        throw new Error(
            'Cannot reshape annotation missing createdWhen timestamp',
        )
    }
    return {
        localId: annot.url,
        unifiedListIds: [],
        body: annot.body,
        comment: annot.comment,
        selector: annot.selector,
        creator: suppData.creator,
        normalizedPageUrl: annot.pageUrl,
        isBulkShareProtected: !!annot.isBulkShareProtected,
        isShared: !!annot.isShared,
        lastEdited: annot.lastEdited?.getTime() ?? createdWhen,
        createdWhen,
    }
}

export const reshapeCacheAnnotation = (
    annot: UnifiedAnnotation & Required<Pick<UnifiedAnnotation, 'localId'>>,
): Annotation => ({
    url: annot.localId,
    pageUrl: annot.normalizedPageUrl,
    body: annot.body,
    comment: annot.comment,
    selector: annot.selector,
    isShared: annot.isShared,
    isBulkShareProtected: annot.isBulkShareProtected,
    lastEdited: new Date(annot.lastEdited),
    createdWhen: new Date(annot.createdWhen),
    lists: [],
    tags: [],
})

export const reshapeListForCache = (
    list: PageList,
    suppData: { creator?: UserReference },
): Omit<UnifiedList, 'unifiedId'> => ({
    name: list.name,
    localId: list.id,
    remoteId: list.remoteId,
    creator: suppData.creator,
    description: list.description,
    unifiedAnnotationIds: [],
})
