import type { HighlightDependencies, HighlightsScriptMain } from './types'
import { HighlightColor } from '@worldbrain/memex-common/lib/common-ui/components/highlightColorPicker/types'
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
            hideHighlights(options)
        }
    })
    options.inPageUI.events.on('stateChanged', async (event) => {
        if (!('highlights' in event.changes)) {
            return
        }

        if (event.newState.highlights) {
            await showHighlights(options)
        } else {
            hideHighlights(options)
        }
    })
}

const showHighlights = async (options: HighlightDependencies) => {
    await options.highlightRenderer.renderHighlights(
        options.annotationsCache.getAnnotationsArray().map((annot) => ({
            id: annot.unifiedId,
            selector: annot.selector,
            color: annot.color as HighlightColor['id'],
        })),
        ({ annotationId, openInEdit }) => {
            if (openInEdit || options.inPageUI.componentsShown.sidebar) {
                return options.inPageUI.showSidebar({
                    action: openInEdit ? 'edit_annotation' : 'show_annotation',
                    annotationCacheId: annotationId.toString(),
                })
            } else {
                options.inPageUI.showTooltip({
                    annotationCacheId: annotationId.toString(),
                })
            }
        },

        { removeExisting: false },
    )
}

const hideHighlights = (options: HighlightDependencies) => {
    options.highlightRenderer.resetHighlightsStyles()
}

// const registry = globalThis['contentScriptRegistry'] as ContentScriptRegistry
// registry.registerHighlightingScript(main)
