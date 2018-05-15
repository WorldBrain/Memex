import { bodyLoader } from 'src/util/loader'
import * as interactions from './interactions'
import renderUI from './react'

export async function init() {
    await bodyLoader()

    const target = document.createElement('div')
    target.setAttribute('id', 'memex-direct-linking-tooltip')
    document.body.appendChild(target)

    renderUI(target)

    interactions.setupTooltipTrigger(({ x, y }) => {})
}

init()
