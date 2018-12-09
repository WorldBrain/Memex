import { bodyLoader, interactiveLoader } from '../../util/loader'
import ToolbarNotifications from '../../toolbar-notification/content_script'
import * as interactions from './interactions'
import { getSidebarState } from '../utils'

const onKeydown = (e, toolbarNotifications) => {
    if (e.key !== 'm') {
        return
    }

    interactions.insertRibbon({ toolbarNotifications })
}

export default async ({
    toolbarNotifications,
}: {
    toolbarNotifications: ToolbarNotifications
}) => {
    interactions.setupRPC()

    const isSidebarEnabled = await getSidebarState()
    if (!isSidebarEnabled) {
        return
    }

    const onKeydownWrapper = e => {
        onKeydown(e, toolbarNotifications)
    }

    await interactiveLoader()
    document.addEventListener('keydown', onKeydownWrapper, false)

    await bodyLoader()
    document.removeEventListener('keydown', onKeydownWrapper, false)
    const passwordInputs = document.querySelectorAll('input[type=password]')
    const hasPasswordInput = passwordInputs.length > 0
    if (hasPasswordInput) {
        return
    }

    interactions.insertRibbon({ toolbarNotifications })
}
