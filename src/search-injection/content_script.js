import * as constants from './constants'
import * as utils from './utils'
import { handleRender } from './dom'

import { SEARCH_CONN_NAME, CMDS } from '../overview/constants'

const url = window.location.href
const matched = utils.matchURL(url)

const cmdHandler = ({ cmd, ...payload }) => {
    // cmd: (string) status of the search result returned
    // payload: (object) contains doc and totalCount
    // Listens in the search port for message

    switch (cmd) {
        case CMDS.RESULTS:
            // Render only if there is atleast one result
            if (payload.searchResult.docs.length) {
                handleRender(payload.searchResult, matched)
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

    port.postMessage({ cmd: CMDS.SEARCH, searchParams: { query } })
}

const init = async () => {
    // Fetches SearchInjection user preferance from storage
    // If true, proceed with matching URL and fetching search query

    const searchInjection = await utils.getLocalStorage(
        constants.SEARCH_INJECTION_KEY,
        constants.SEARCH_INJECTION_DEFAULT,
    )

    if (matched && searchInjection[matched]) {
        const query = utils.fetchQuery(url)
        search(query)
    }
}

init()
