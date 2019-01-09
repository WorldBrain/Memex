import * as AllRaven from 'raven-js'
import { retryUntil } from '../utils'
import { attachEventListenersToNewHighlights } from 'src/sidebar-overlay/content_script/highlight-interactions'
import { descriptorToRange, markRange } from './annotations'

import styles from './styles.css'

const Raven = AllRaven['default']

export async function highlightAnnotation(
    { annotation },
    focusOnAnnotation = null,
    hoverAnnotationContainer = null,
) {
    const baseClass = styles['memex-highlight']
    try {
        await Raven.context(async () => {
            let descriptor
            if (annotation.anchors) {
                descriptor = annotation.anchors[0].descriptor
            } else {
                descriptor = annotation.selector.descriptor
            }

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

            markRange({ range, cssClass: baseClass })

            attachEventListenersToNewHighlights(
                annotation,
                focusOnAnnotation,
                hoverAnnotationContainer,
            )
        })
    } catch (e) {
        console.error(
            'MEMEX: Error during annotation anchoring/highlighting:',
            e,
        )
        console.error(e.stack)
        return false
    }

    return true
}
