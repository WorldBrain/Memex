import { delayed, getTooltipState } from './utils'
let mouseupListener = null

export function setupTooltipTrigger(callback) {
    mouseupListener = event => {
        conditionallyTriggerTooltip(
            { x: event.pageX, y: event.pageY },
            callback,
            event,
        )
    }

    document.body.addEventListener('mouseup', mouseupListener)
}

export function destroyTooltipTrigger() {
    document.body.removeEventListener('mouseup', mouseupListener)
    mouseupListener = null
}

export const conditionallyTriggerTooltip = delayed(
    async (position, callback, event) => {
        const isTooltipEnabled = await getTooltipState()
        if (
            !userSelectedText() ||
            !isTooltipEnabled ||
            isTargetInsideTooltip(event)
        ) {
            return
        }

        callback(position)
    },
    300,
)

function userSelectedText() {
    const selection = document.getSelection()
    const userSelectedText = !!selection && !selection.isCollapsed
    return userSelectedText
}

function isTargetInsideTooltip(event) {
    const $tooltipContainer = document.querySelector(
        '#memex-direct-linking-tooltip',
    )
    if (!$tooltipContainer) {
        // edge case, where the destroy() is called
        return true
    }
    return $tooltipContainer.contains(event.target)
}
