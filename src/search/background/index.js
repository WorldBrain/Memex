import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import searchConnectionHandler from './search-connection-handler'
import {
    setTags,
    addTags,
    delTags,
    suggestTags,
    fetchTags,
} from '../search-index/tags'

makeRemotelyCallable({
    addTags,
    delTags,
    setTags,
    fetchTags,
    suggestTags,
})

// Allow other scripts to connect to background index and send queries
browser.runtime.onConnect.addListener(searchConnectionHandler)
