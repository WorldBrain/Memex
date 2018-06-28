import { highlightAnnotation } from 'src/direct-linking/content_script/rendering'
import {
    scrollToHighlight,
    removeHighlights,
} from 'src/direct-linking/content_script/interactions'

export const highlightAndScroll = async annotation => {
    removeHighlights()
    await highlightAnnotation({ annotation })
    scrollToHighlight()
}
