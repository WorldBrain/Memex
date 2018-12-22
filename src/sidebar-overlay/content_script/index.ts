import { bodyLoader, interactiveLoader } from '../../util/loader'
import ToolbarNotifications from '../../toolbar-notification/content_script'
import * as interactions from './interactions'
import { getSidebarState } from '../utils'

const onKeydown = (
    e: KeyboardEvent,
    toolbarNotifications: ToolbarNotifications,
) => {
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
    interactions.setupRPC({ toolbarNotifications })

    const isSidebarEnabled = await getSidebarState()
    if (!isSidebarEnabled) {
        return
    }

    const onKeydownWrapper = (e: KeyboardEvent) => {
        onKeydown(e, toolbarNotifications)
    }

    await interactiveLoader()
    document.addEventListener('keydown', onKeydownWrapper, false)

    await bodyLoader()
    document.removeEventListener('keydown', onKeydownWrapper, false)

    interactions.insertRibbon({ toolbarNotifications })
}
