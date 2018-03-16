import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import * as blacklist from './interface'
import * as constants from './constants'

makeRemotelyCallable({
    fetchBlacklist: blacklist.fetchBlacklist,
    isURLBlacklisted: blacklist.isURLBlacklisted,
    addToBlacklist: blacklist.addToBlacklist,
})

export { blacklist, constants }
