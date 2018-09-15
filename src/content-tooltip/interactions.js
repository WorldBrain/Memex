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

/**
 * Checks for certain conditions before triggering the tooltip.
 * i) Whether the selection made by the user is just text.
 * ii) Whether the user has enabled the tooltip in his preferences.
 * iii) Whether the selected target is not inside the tooltip itself.
 *
 * Event is undefined in the scenario of user selecting the text before the
 * page has loaded. So we don't need to check for condition iii) since the
 * tooltip wouldn't have popped up yet.
 */
export const conditionallyTriggerTooltip = delayed(async (callback, event) => {
    const isTooltipEnabled = await getTooltipState()
    if (
        !userSelectedText() ||
        !isTooltipEnabled ||
        (event && isTargetInsideTooltip(event))
    ) {
        return
    }

    /*
    If all the conditions passed, then this returns the position to anchor the
    tooltip. The positioning is based on the user's preferred method. But in the
    case of tooltip popping up before page load, it resorts to text based method
    */
    const positioning = await getPositionState()
    let position
    if (positioning === 'text' || !event) {
        position = calculateTooltipPostion()
    } else if (positioning === 'mouse' && event) {
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
