import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import searchConnectionHandler from './search-connection-handler'
import {
    setTags,
    addTags,
    delTags,
    suggestTags,
    fetchTags,
} from '../search-index/tags'
import suggestDomains from '../search-index/suggestDomains'

makeRemotelyCallable({
    addTags,
    delTags,
    setTags,
    fetchTags,
    suggestTags,
    suggestDomains,
})

// Allow other scripts to connect to background index and send queries
browser.runtime.onConnect.addListener(searchConnectionHandler)
