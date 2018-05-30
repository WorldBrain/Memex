import { delayed } from './utils'

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
        if (!userSelectedText()) {
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
