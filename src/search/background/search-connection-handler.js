import { CMDS, SEARCH_CONN_NAME } from 'src/overview/constants'
import { search } from 'src/search'

/**
 * Connects function affording search to a runtime messaging port.
 * @param {Port} port WebExt runtime port.
 * @returns {(any) => void} Function affording search, sending results over `port`.
 */
const connectSearch = port => async ({ searchParams, overwrite }) => {
    try {
        const searchResult = await search(searchParams)

        port.postMessage({
            cmd: CMDS.RESULTS,
            searchResult,
            overwrite,
        })
    } catch (error) {
        console.error(error)
        port.postMessage({
            cmd: CMDS.ERROR,
            error: error.message,
            query: searchParams.query,
        })
    }
}

export default async function searchConnectionHandler(port) {
    // Make sure to only handle connection logic for search (allows other use of runtime.connect)
    if (port.name !== SEARCH_CONN_NAME) return

    const doSearch = connectSearch(port)
    console.log('overview search UI connected')

    port.onMessage.addListener(({ cmd, ...payload }) => {
        switch (cmd) {
            case CMDS.SEARCH:
                return doSearch(payload)
            default:
                return console.error(`unknown search command: ${cmd}`)
        }
    })
}
