import { delayed } from './utils'

export function setupTooltipTrigger() {
    document.body.addEventListener('mouseup', () => {
        conditionallyTriggerTooltip()
    })
}

export const conditionallyTriggerTooltip = delayed(() => {
    if (isTooltipShown()) {
        return
    }

    if (!userSelectedText()) {
        return
    }

    console.log('show tooltip')
}, 300)

function isTooltipShown() {}

function userSelectedText() {
    const selection = document.getSelection()
    const userSelectedText = !!selection && !selection.isCollapsed
    return userSelectedText
}
