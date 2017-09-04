import searchConnectionHandler from './search-connection-handler'

// Allow other scripts to connect to background index and send queries
browser.runtime.onConnect.addListener(searchConnectionHandler)
