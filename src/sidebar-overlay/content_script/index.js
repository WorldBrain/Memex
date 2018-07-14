import { bodyLoader } from 'src/util/loader'

import * as interactions from './interactions'
import { getLocalStorage } from 'src/util/storage'

import { TOOLTIP_STORAGE_NAME } from 'src/content-tooltip/constants'

const init = async () => {
    interactions.setupRPC()

    const isTooltipEnabled = await getLocalStorage(TOOLTIP_STORAGE_NAME)
    if (!isTooltipEnabled) return

    await bodyLoader()

    interactions.insertRibbon()
}

init()
