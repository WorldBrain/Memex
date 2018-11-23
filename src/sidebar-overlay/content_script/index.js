import { bodyLoader, interactiveLoader } from 'src/util/loader'

import * as interactions from './interactions'
import { getSidebarState } from '../utils'

const onKeydown = e => {
    if (e.key !== 'm') {
        return
    }

    interactions.insertRibbon()
}

const init = async () => {
    interactions.setupRPC()

    console.log('hello fuckso!')
    const isSidebarEnabled = await getSidebarState()
    if (!isSidebarEnabled) {
        return
    }

    await interactiveLoader()
    document.addEventListener('keydown', onKeydown, false)

    await bodyLoader()
    document.removeEventListener('keydown', onKeydown, false)
    const passwordInputs = document.querySelectorAll('input[type=password]')
    const hasAPasswordInput = passwordInputs.length > 0
    if (hasAPasswordInput) {
        return
    }

    interactions.insertRibbon()
}

if ([].length > 1) {
    init()
}
