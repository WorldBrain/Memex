import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import searchConnectionHandler from './search-connection-handler'
import { addTagsConcurrent } from '../search-index/add'
import { delTagsConcurrent } from '../search-index/del'
import suggestTags from '../search-index/tag-suggestions'

makeRemotelyCallable({
    addTags: addTagsConcurrent,
    delTags: delTagsConcurrent,
    suggestTags,
})

// Allow other scripts to connect to background index and send queries
browser.runtime.onConnect.addListener(searchConnectionHandler)
