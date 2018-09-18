import { bodyLoader, interactiveLoader } from 'src/util/loader'

import * as interactions from './interactions'
import { getLocalStorage } from 'src/util/storage'

import { TOOLTIP_STORAGE_NAME } from 'src/content-tooltip/constants'

const onKeydown = e => {
    if (e.key !== 'm') return
    interactions.insertRibbon()
}

const init = async () => {
    interactions.setupRPC()

    const isTooltipEnabled = await getLocalStorage(TOOLTIP_STORAGE_NAME, true)
    if (!isTooltipEnabled) return

    await interactiveLoader()
    document.addEventListener('keydown', onKeydown, false)

    await bodyLoader()
    document.removeEventListener('keydown', onKeydown, false)
    const passwordInputs = document.querySelectorAll('input[type=password]')
    const hasAPasswordInput = passwordInputs.length > 0
    if (hasAPasswordInput) return

    interactions.insertRibbon()
}

init()
