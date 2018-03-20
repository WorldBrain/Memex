import * as constants from './constants'
import * as utils from './utils'
import { handleRender } from './dom'

import { SEARCH_CONN_NAME, CMDS } from '../overview/constants'

const cmdHandler = ({ cmd, ...payload }) => {
    // cmd: (string) status of the search result returned
    // payload: (object) contains doc and totalCount
    // Listens in the search port for message

    switch (cmd) {
        case CMDS.RESULTS:
            console.log(payload)
            // Render only if there is atleast one result
            if (payload.searchResult.docs.length) {
                handleRender(payload.searchResult)
            }
            break
        case CMDS.ERROR:
            break
        default:
            console.error(`Unknown command ${cmd} with payload \n${payload}`)
    }
}

const search = query => {
    // query: (string) query to be search
    // Creates a connection to the search in background.js
    // And sends query as a message

    const port = browser.runtime.connect({ name: SEARCH_CONN_NAME })
    port.onMessage.addListener(cmdHandler)

    const searchParams = {
        query,
        getTotalCount: true,
    }

    port.postMessage({ cmd: CMDS.SEARCH, searchParams })
}

const init = async () => {
    // Fetches SearchInjection user preferance from storage
    // If true, proceed with matching URL and fetching search query

    const searchInjection = await utils.getLocalStorage(
        constants.SEARCH_INJECTION_KEY,
        true,
    )
    
    if (!searchInjection)
        return;


    const url = window.location.href
    const matched = utils.matchURL(url)
    if (matched){
        const query = utils.fetchQuery(url)
        search(query)
    }
}

init()
