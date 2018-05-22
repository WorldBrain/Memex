import { retryUntil } from '../utils'
import { descriptorToRange, markRange } from './annotations'

export async function highlightAnnotation({ annotation }) {
    // console.log('highlighting')
    const descriptor = annotation.anchors[0].descriptor
    const range = await retryUntil(
        () => descriptorToRange({ descriptor }),
        range => range !== null,
        {
            intervalMiliseconds: 200,
            timeoutMiliseconds: 5000,
        },
    )
    markRange({ range, cssClass: 'memex-highlight' })
    document.querySelector('.memex-highlight').style.background = '#3eb995'
}
