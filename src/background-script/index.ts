import * as utils from './utils'
import { makeRemotelyCallable } from '../util/webextensionRPC'

class BackgroundScript {
    private utils: typeof utils

    constructor({ utilFns = utils }) {
        this.utils = utilFns
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            openOverviewTab: this.utils.openOverviewURL,
            openOptionsTab: this.utils.openOptionsURL,
        })
    }
}

export { utils }
export default BackgroundScript
