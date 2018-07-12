var config = require('./config')

/**
 * Log using console.log, when remoteStorage logging is enabled.
 *
 * You can enable logging with ``RemoteStorage#enableLog``.
 *
 * (In node.js you can also enable logging during remoteStorage object
 * creation. See: {@link RemoteStorage}).
 */
function log() {
    if (config.logging) {
        // eslint-disable-next-line no-console
        console.log.apply(console, arguments)
    }
}

module.exports = log
