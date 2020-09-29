import { Tabs } from 'webextension-polyfill-ts'

import { makeRemotelyCallableType } from 'src/util/webextensionRPC'
import initPauser, { getState as getPauseState } from './pause-logging'
import { ActivityLoggerInterface } from './types'

export default class ActivityLoggerBackground {
    remoteFunctions: ActivityLoggerInterface

    private toggleLoggingPause = initPauser()

    constructor() {
        this.remoteFunctions = {
            isLoggingPaused: this.isLoggingPaused.bind(this),
            toggleLoggingPause: this.toggleLoggingPause,
        }
    }

    static isTabLoaded = (tab: Tabs.Tab) => tab.status === 'complete'

    setupRemoteFunctions() {
        makeRemotelyCallableType<ActivityLoggerInterface>(this.remoteFunctions)
    }

    private async isLoggingPaused(): Promise<boolean> {
        const result = await getPauseState()

        return result !== false
    }
}
