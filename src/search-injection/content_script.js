import * as constants from './constants'
import { SEARCH_CONN_NAME, CMDS } from '../overview/constants'

const cmdHandler = ({ cmd, ...payload }) => {
    switch (cmd) {
        case CMDS.RESULTS:
            console.log(payload)
            break
        case CMDS.ERROR:
            break
        default:
            console.error(`Unknown command ${cmd} with payload \n${payload}`)
    }
}

const search = query => {
    // Init a connection to the search background
    const port = browser.runtime.connect({ name: SEARCH_CONN_NAME })
    port.onMessage.addListener(cmdHandler)

    const searchParams = {
        limit: constants.LIMIT,
        query,
    }

    port.postMessage({ cmd: CMDS.SEARCH, searchParams })
}

// Get the window's current URL
// Do a regex match of URL against Search Engine's query URLs
// (Google for now)
// And extract the query
const href = window.location.href

const gRegex = constants.SEARCH_ENGINES.google.regex
if (href.match(gRegex) != null) {
    const url = new URL(href)
    const query = url.searchParams.get('q')
    search(query)
}
