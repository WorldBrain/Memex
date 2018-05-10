import { descriptorToRange, markRange } from './annotations'

export async function highlightAnnotation({ annotation }) {
    console.log('highlighting')
    const descriptor = annotation.anchors[0].descriptor
    const range = await descriptorToRange({ descriptor })
    console.log('found range', range)
    markRange({ range, cssClass: 'memex-highlight' })
    document.querySelector('.memex-highlight').style.background = '#3eb995'
}
