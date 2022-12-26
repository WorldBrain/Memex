import type {
    UnifiedAnnotation,
    UnifiedList,
} from 'src/annotations/cache/types'
import type { AnnotationCardInstance, ListInstance } from './types'

export const generateAnnotationCardInstanceId = (
    { unifiedId }: Pick<UnifiedAnnotation, 'unifiedId'>,
    type: UnifiedList['unifiedId'] | 'annotations-tab',
): string => `${type}-${unifiedId}`

export const initAnnotationCardInstance = (
    annot: Pick<UnifiedAnnotation, 'unifiedId' | 'comment'>,
): AnnotationCardInstance => ({
    unifiedAnnotationId: annot.unifiedId,
    comment: annot.comment ?? '',
    isCommentTruncated: true,
    isCommentEditing: false,
    cardMode: 'none',
})

export const initListInstance = (
    list: Pick<
        UnifiedList,
        'unifiedId' | 'unifiedAnnotationIds' | 'hasRemoteAnnotations'
    >,
): ListInstance => ({
    sharedAnnotationReferences: list.hasRemoteAnnotations ? [] : undefined,
    annotationsCountLoadState: 'pristine',
    annotationsLoadState: 'pristine',
    unifiedListId: list.unifiedId,
    isOpen: false,
})
