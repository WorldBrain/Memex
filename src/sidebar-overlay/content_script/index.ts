import { bodyLoader, interactiveLoader } from 'src/util/loader'
import ToolbarNotifications from 'src/toolbar-notification/content_script'
import * as interactions from './ribbon-interactions'
import { getSidebarState } from '../utils'
import AnnotationsManager from 'src/annotations/annotations-manager'
import { runOnScriptShutdown } from 'src/content-tooltip/utils'

const initRibbonAndSidebar = async ({
    annotationsManager,
    toolbarNotifications,
    store,
}: {
    annotationsManager: AnnotationsManager
    toolbarNotifications: ToolbarNotifications
    store: any
}) => {
    runOnScriptShutdown(() => interactions.removeRibbon())
    interactions.setupRPC({ annotationsManager, toolbarNotifications, store })

    const isSidebarEnabled = await getSidebarState()
    if (!isSidebarEnabled) {
        return
    }

    await interactiveLoader()
    await bodyLoader()

    interactions.insertRibbon({
        annotationsManager,
        toolbarNotifications,
        store,
    })
}

export default initRibbonAndSidebar
