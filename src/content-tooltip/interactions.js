import { delayed } from './utils'
import { createDirectLink } from '../direct-linking/interactions'

export function setupTooltipTrigger() {
    document.body.addEventListener('mouseup', () => {
        conditionallyTriggerTooltip()
    })
}

export const conditionallyTriggerTooltip = delayed(async () => {
    if (isTooltipShown()) {
        return
    }

    if (!userSelectedText()) {
        return
    }

    console.log('show tooltip')
    console.log(await createDirectLink())
}, 300)

function isTooltipShown() {}

function userSelectedText() {
    const selection = document.getSelection()
    const userSelectedText = !!selection && !selection.isCollapsed
    return userSelectedText
}
