import * as constants from 'src/overview/constants'
import indexSearch from 'src/search'

const search = ({ searchParams, overwrite }) => async port => {
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

    console.log('overview search UI connected')

    port.onMessage.addListener(({ cmd, ...payload }) => {
        switch (cmd) {
            case constants.CMDS.SEARCH: return search(payload)(port)
            default: return console.error(`unknown search command: ${cmd}`)
        }
    })
}
