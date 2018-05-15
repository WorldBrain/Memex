import { delayed } from './utils'
import { createDirectLink } from '../direct-linking/content_script/interactions'

export function setupTooltipTrigger(callback) {
    document.body.addEventListener('mouseup', event => {
        conditionallyTriggerTooltip(
            { x: event.clientX, y: event.clientY },
            callback,
        )
    })
}

export const conditionallyTriggerTooltip = delayed(
    async (position, callback) => {
        if (!userSelectedText()) {
            return
        }

        callback(position)
        // console.log('show tooltip')
        console.log(await createDirectLink())
    },
    300,
)

function userSelectedText() {
    const selection = document.getSelection()
    const userSelectedText = !!selection && !selection.isCollapsed
    return userSelectedText
}
