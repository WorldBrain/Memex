import { delayed, getTooltipState, getPositionState } from './utils'
let mouseupListener = null

export function setupTooltipTrigger(callback) {
    mouseupListener = event => {
        conditionallyTriggerTooltip(callback, event)
    }

    document.body.addEventListener('mouseup', mouseupListener)
}

export function destroyTooltipTrigger() {
    document.body.removeEventListener('mouseup', mouseupListener)
    mouseupListener = null
}

export const conditionallyTriggerTooltip = delayed(async (callback, event) => {
    const isTooltipEnabled = await getTooltipState()
    if (
        !userSelectedText() ||
        !isTooltipEnabled ||
        isTargetInsideTooltip(event)
    ) {
        return
    }
    const positioning = await getPositionState()
    let position
    if (positioning === 'text') {
        position = calculateTooltipPostion()
    } else if (positioning === 'mouse') {
        position = { x: event.pageX, y: event.pageY }
    }
    callback(position)
}, 300)

function calculateTooltipPostion() {
    const range = document.getSelection().getRangeAt(0)
    const boundingRect = range.getBoundingClientRect()
    // x = position of element from the left + half of it's width
    const x = boundingRect.left + boundingRect.width / 2
    // y = scroll height from top + pixels from top + height of element - offset
    const y = window.pageYOffset + boundingRect.top + boundingRect.height - 10
    return {
        x,
        y,
    }
}

function isAnchorOrContentEditable(selected) {
    // Returns true if the any of the parent is an anchor element
    // or is content editable.
    let parent = selected.parentElement
    while (parent) {
        if (parent.contentEditable === 'true' || parent.nodeName === 'A') {
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
    const extras = isAnchorOrContentEditable(container)

    const userSelectedText =
        !!selection && !selection.isCollapsed && !!selectedString && !extras
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
