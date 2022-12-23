import type {
    UnifiedAnnotation,
    UnifiedList,
} from 'src/annotations/cache/types'
import type { AnnotationCardInstance, ListInstance } from './types'

export const generateAnnotationCardInstanceId = (
    { unifiedId }: UnifiedAnnotation,
    type: UnifiedList['unifiedId'] | 'annotations-tab',
): string => `${type}-${unifiedId}`

export const initAnnotationCardInstance = (
    annot: UnifiedAnnotation,
): AnnotationCardInstance => ({
    unifiedAnnotationId: annot.unifiedId,
    comment: annot.comment ?? '',
    isCommentTruncated: true,
    isCommentEditing: false,
})

export const initListInstance = (list: UnifiedList): ListInstance => ({
    unifiedListId: list.unifiedId,
    isOpen: false,
})
