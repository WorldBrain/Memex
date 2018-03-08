import * as constants from './constants'

export const doSearch = (query, getCmdMessageHandler) => {
    const port = browser.runtime.connect({ name: constants.SEARCH_CONN_NAME })
    const searchParams = {
        ...query,
        limit: constants.INJECTOR_RESULTS_LIMIT,
        getTotalCount: true,
    }

    port.onMessage.addListener(getCmdMessageHandler)
    port.postMessage({ cmd: constants.CMDS.SEARCH, searchParams })
}
