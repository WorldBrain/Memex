import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { Annotation } from '../types'
import type { UnifiedAnnotation } from './types'

export const reshapeAnnotationForCache = (
    annot: Annotation &
        Required<Pick<Annotation, 'createdWhen' | 'lastEdited'>>,
    suppData: { creator: UserReference },
): Omit<UnifiedAnnotation, 'unifiedId'> &
    Partial<Pick<UnifiedAnnotation, 'unifiedId'>> => ({
    localId: annot.url,
    unifiedListIds: [],
    body: annot.body,
    comment: annot.comment,
    selector: annot.selector,
    creator: suppData.creator,
    normalizedPageUrl: annot.pageUrl,
    lastEdited: annot.lastEdited.getTime(),
    createdWhen: annot.createdWhen.getTime(),
    isBulkShareProtected: !!annot.isBulkShareProtected,
    isShared: !!annot.isShared,
})

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
