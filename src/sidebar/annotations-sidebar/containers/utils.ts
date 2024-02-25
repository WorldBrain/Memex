import React from 'react'
import type {
    UnifiedAnnotation,
    UnifiedList,
} from 'src/annotations/cache/types'
import type { AnnotationCardInstanceLocation } from '../types'
import type {
    AnnotationCardInstance,
    AnnotationInstanceRefs,
    ListInstance,
} from './types'

export const generateAnnotationCardInstanceId = (
    { unifiedId }: Pick<UnifiedAnnotation, 'unifiedId'>,
    instanceLocation: AnnotationCardInstanceLocation = 'annotations-tab',
): string => `${instanceLocation}-${unifiedId}`

export const initAnnotationCardInstance = (
    annot: Pick<UnifiedAnnotation, 'unifiedId' | 'comment' | 'body'>,
): AnnotationCardInstance => ({
    unifiedAnnotationId: annot.unifiedId,
    comment: annot.comment ?? '',
    isCommentTruncated: true,
    isCommentEditing: false,
    isHighlightEditing: false,
    body: annot.body ?? '',
    cardMode: 'none',
    color: null,
    copyLoadingState: 'pristine',
})

export const initListInstance = (
    list: Pick<
        UnifiedList,
        'unifiedId' | 'unifiedAnnotationIds' | 'hasRemoteAnnotationsToLoad'
    >,
): ListInstance => ({
    sharedAnnotationReferences: list.hasRemoteAnnotationsToLoad
        ? []
        : undefined,
    annotationRefsLoadState: 'pristine',
    conversationsLoadState: 'pristine',
    annotationsLoadState: 'pristine',
    unifiedListId: list.unifiedId,
    isOpen: false,
})

export const createAnnotationInstanceRefs = (): AnnotationInstanceRefs => ({
    shareMenuBtn: React.createRef(),
    copyPasterBtn: React.createRef(),
    spacePickerBodyBtn: React.createRef(),
    spacePickerFooterBtn: React.createRef(),
})

/**
 * NOTE: This shouldn't need to exist. When we clean up AnnotationSidebarContainer + AnnotationSidebar to each
 *  have their own unique concerns, this logic can exist as part of AnnotationsSidebarContainer.
 */
export const getOrCreateAnnotationInstanceRefs = (
    instanceId: string,
    refs: { [instanceId: string]: AnnotationInstanceRefs },
): AnnotationInstanceRefs => {
    let instanceRefs = refs[instanceId]
    if (!instanceRefs) {
        instanceRefs = createAnnotationInstanceRefs()
        refs[instanceId] = instanceRefs
    }
    return instanceRefs
}
