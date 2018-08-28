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

function isInsideContentEditableElement(selected) {
    let parent = selected.parentElement
    while (parent) {
        if (parent.contentEditable === 'true') {
            return true
        }
        parent = parent.parentElement
    }
    return false
}

function userSelectedText() {
    const selection = document.getSelection()
    const selectedString = selection.toString().trim()
    const container = selection.getRangeAt(0).commonAncestorContainer
    const isContentEditable = isInsideContentEditableElement(container)

    const userSelectedText =
        !!selection &&
        !selection.isCollapsed &&
        !!selectedString &&
        !isContentEditable
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
