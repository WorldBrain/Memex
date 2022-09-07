import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import * as constants from './constants'

export function setupBlacklistRemoteFunctions() {
    makeRemotelyCallable({
        isURLBlacklisted: async () => false,
        addToBlacklist: async () => {},
        // isURLBlacklisted: blacklist.isURLBlacklisted,
        // addToBlacklist: blacklist.addToBlacklist,
    })
}

export { constants }
