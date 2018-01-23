import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import searchConnectionHandler from './search-connection-handler'
import { setTags, addTags, delTags, fetchTags } from '../search-index/tags'
import suggest from '../search-index/suggest'

makeRemotelyCallable({
    addTags,
    delTags,
    setTags,
    fetchTags,
    suggest,
})

// Allow other scripts to connect to background index and send queries
browser.runtime.onConnect.addListener(searchConnectionHandler)
