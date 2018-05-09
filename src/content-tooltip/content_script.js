import { bodyLoader } from './utils'
import * as interactions from './interactions'

export async function init() {
    await bodyLoader()
    interactions.setupTooltipTrigger()
}

init()
