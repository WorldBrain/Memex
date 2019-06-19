import { runInTab } from 'src/util/webextensionRPC'

export function remoteFunctionsInTab(tabId) {
    return {
        ribbon: runInTab<RibbonInterface>(tabId),
    }
}

interface RibbonInterface {
    removeRibbon()
    insertRibbon()
}
