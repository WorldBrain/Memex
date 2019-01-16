import { bodyLoader, interactiveLoader } from 'src/util/loader'
import ToolbarNotifications from 'src/toolbar-notification/content_script'
import * as interactions from './ribbon-interactions'
import { getSidebarState } from '../utils'
import AnnotationsManager from 'src/sidebar-common/annotations-manager'

const onKeydown = (
    e: KeyboardEvent,
    {
        annotationsManager,
        toolbarNotifications,
    }: {
        annotationsManager: AnnotationsManager
        toolbarNotifications: ToolbarNotifications
    },
) => {
    if (e.key !== 'm') {
        return
    }

    interactions.insertRibbon({ annotationsManager, toolbarNotifications })
}

const initRibbonAndSidebar = async ({
    annotationsManager,
    toolbarNotifications,
}: {
    annotationsManager: AnnotationsManager
    toolbarNotifications: ToolbarNotifications
}) => {
    interactions.setupRPC({ annotationsManager, toolbarNotifications })

    const isSidebarEnabled = await getSidebarState()
    if (!isSidebarEnabled) {
        return
    }

    const onKeydownWrapper = (e: KeyboardEvent) => {
        onKeydown(e, { annotationsManager, toolbarNotifications })
    }

    await interactiveLoader()
    document.addEventListener('keydown', onKeydownWrapper, false)

    await bodyLoader()
    document.removeEventListener('keydown', onKeydownWrapper, false)

    interactions.insertRibbon({ annotationsManager, toolbarNotifications })
}

export default initRibbonAndSidebar
