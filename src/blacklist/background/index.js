import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import * as blacklist from './interface'
import * as constants from './constants'

makeRemotelyCallable({
    fetchBlacklist: blacklist.fetchBlacklist,
    isURLBlacklisted: blacklist.isURLBlacklisted,
    addToBlacklist: blacklist.addToBlacklist,
})

export { default as convertOldExtBlacklist, CONVERT_TIME_KEY } from './convert'
export { blacklist, constants }
