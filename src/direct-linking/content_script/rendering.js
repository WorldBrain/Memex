import * as AllRaven from 'raven-js'
import { retryUntil } from '../utils'
import { descriptorToRange, markRange } from './annotations'

import styles from './styles.css'

const Raven = AllRaven['default']

export async function highlightAnnotation({ annotation }) {
    try {
        await Raven.context(async () => {
            const descriptor = annotation.anchors[0].descriptor
            Raven.captureBreadcrumb({
                message: 'annotation-selector-received',
                category: 'annotations',
                data: annotation,
            })

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
        })
    } catch (e) {
        console.error('Error during annotation anchoring/highlighting:', e)
        console.error(e.stack)
        return false
    }

    return true
}
