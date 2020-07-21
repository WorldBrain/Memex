import {
    ContentScriptRegistry,
    HighlightDependencies,
    HighlightsScriptMain,
} from './types'
import { bodyLoader } from 'src/util/loader'
import {
    AnnotationClickHandler,
    renderAnnotationCacheChanges,
} from 'src/highlighting/ui/highlight-interactions'

export const main: HighlightsScriptMain = async (options) => {
    showHighlights(options)

    //TODO: Why are these events not being heard?
    options.inPageUI.events.on('componentShouldSetUp', async (event) => {
        if (event.component === 'highlights') {
            console.log('componentShouldSetUp highlights')
            // await bodyLoader()
            await showHighlights(options)
        }
    })
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
            console.log('stateChanged highlights')
            showHighlights(options)
        }
    })
}

let highlightChangesDeregister = () => null
const showHighlights = (options: HighlightDependencies) => {
    const onClickHighlight: AnnotationClickHandler = ({
        annotationUrl,
        openSidebar,
    }) => {
        if (openSidebar) {
            options.inPageUI.showSidebar({
                action: 'show_annotation',
                annotationUrl,
            })
        } else {
            options.inPageUI.events.emit('sidebarAction', {
                action: 'show_annotation',
                annotationUrl,
            })
        }
    }

    options.highlightRenderer.renderHighlights(
        options.annotationsCache.annotations,
        onClickHighlight,
        false,
    )

    highlightChangesDeregister = renderAnnotationCacheChanges({
        cacheChanges: options.annotationsCache.annotationChanges,
        renderer: options.highlightRenderer,
        onClickHighlight,
    })
}

const hideHighlights = (options: HighlightDependencies) => {
    options.highlightRenderer.removeHighlights()
    highlightChangesDeregister()
}

// const registry = window['contentScriptRegistry'] as ContentScriptRegistry
// registry.registerHighlightingScript(main)
