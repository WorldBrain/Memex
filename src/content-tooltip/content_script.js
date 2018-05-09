import { bodyLoader } from 'src/util/loader'
import * as interactions from './interactions'

export async function init() {
    await bodyLoader()
    interactions.setupTooltipTrigger()
}

init()
