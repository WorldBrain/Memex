import { descriptorToRange, markRange } from './annotations'

export async function highlightAnnotation({ annotation }) {
    const descriptor = annotation.anchors[0].descriptor
    const range = await descriptorToRange({ descriptor })
    markRange({ range, cssClass: 'memex-highlight' })
    document.querySelector('.memex-highlight').style.background = '#3eb995'
}
