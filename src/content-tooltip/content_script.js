import { bodyLoader } from 'src/util/loader'
import * as interactions from './interactions'

export async function init() {
    await bodyLoader()

    const target = document.createElement('div')
    target.setAttribute('id', 'memex-direct-linking-tooltip')
    document.body.appendChild(target)

    const showTooltip = await interactions.setupUIContainer(target)
    interactions.setupTooltipTrigger(showTooltip)
}

init()
