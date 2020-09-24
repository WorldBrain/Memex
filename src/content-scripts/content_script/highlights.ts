import { HighlightDependencies, HighlightsScriptMain } from './types'
import { AnnotationClickHandler } from 'src/highlighting/ui/types'
// import { bodyLoader } from 'src/util/loader'

export const main: HighlightsScriptMain = async (options) => {
    // Highlights is currently not a separate script, so no need for this
    // options.inPageUI.events.on('componentShouldSetUp', async (event) => {
    //     if (event.component === 'highlights') {
    //         // await bodyLoader()
    //         await showHighlights(options)
    //     }
    // })

    options.inPageUI.events.on('componentShouldDestroy', async (event) => {
        if (event.component === 'highlights') {
            await hideHighlights(options)
        }
    })
    options.inPageUI.events.on('stateChanged', async (event) => {
        if (!('highlights' in event.changes)) {
            return
        }

        if (event.newState.highlights) {
            showHighlights(options)
        } else {
            hideHighlights(options)
        }
    })
}

const showHighlights = (options: HighlightDependencies) => {
    const onClickHighlight: AnnotationClickHandler = ({ annotationUrl }) => {
        options.inPageUI.showSidebar({
            action: 'edit_annotation',
            annotationUrl,
        })
    }

    options.highlightRenderer.renderHighlights(
        options.annotationsCache.annotations,
        onClickHighlight,
        false,
    )
}

const hideHighlights = (options: HighlightDependencies) => {
    options.highlightRenderer.removeHighlights()
}

// const registry = window['contentScriptRegistry'] as ContentScriptRegistry
// registry.registerHighlightingScript(main)
