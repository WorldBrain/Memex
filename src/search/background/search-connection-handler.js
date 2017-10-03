import * as constants from 'src/overview/constants'
import indexSearch from 'src/search'

/**
 * Connects function affording search to a runtime messaging port.
 * @param {Port} port WebExt runtime port.
 * @returns {(any) => void} Function affording search, sending results over `port`.
 */
const connectSearch = port => async ({ searchParams, overwrite }) => {
    try {
        const searchResult = await indexSearch(searchParams)

        port.postMessage({ cmd: constants.CMDS.RESULTS, searchResult, overwrite })
    } catch (error) {
        console.error(error)
        port.postMessage({ cmd: constants.CMDS.ERROR, error: error.message, query: searchParams.query })
    }
}

export default async function searchConnectionHandler(port) {
    // Make sure to only handle connection logic for search (allows other use of runtime.connect)
    if (port.name !== constants.SEARCH_CONN_NAME) return

    const search = connectSearch(port)
    console.log('overview search UI connected')

    port.onMessage.addListener(({ cmd, ...payload }) => {
        switch (cmd) {
            case constants.CMDS.SEARCH: return search(payload)
            default: return console.error(`unknown search command: ${cmd}`)
        }
    })
}
