import { retryUntil } from '../utils'
import { descriptorToRange, markRange } from './annotations'

import styles from './styles.css'

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
    console.log('Memex - found range:', range, range.toString())
    markRange({ range, cssClass: styles['memex-highlight'] })
}
