import { highlightAnnotation } from 'src/direct-linking/content_script/rendering'
import {
    scrollToHighlight,
    removeHighlights,
} from 'src/direct-linking/content_script/interactions'

/**
 * Given an annotation object, highlights that text and removes other highlights
 * from the page.
 * @param {*} annotation Annotation object which has the selector to be highlighted
 */
export const highlightAndScroll = async annotation => {
    removeHighlights({ isDark: true })
    await highlightAnnotation({ annotation, isDark: true })
    scrollToHighlight({ isDark: true })
}

/**
 * Given an array of annotation objects, highlights all of them.
 * @param {Array<*>} annotations Array of annotations to highlight
 */
export const highlightAnnotations = async annotations => {
    annotations.forEach(
        async annotation => await highlightAnnotation({ annotation }),
    )
}
