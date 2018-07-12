/**
 * The default config, merged with the object passed to the constructor of the
 * RemoteStorage object
 */
var config = {
    cache: true,
    changeEvents: {
        local: true,
        window: false,
        remote: true,
        conflict: true,
    },
    cordovaRedirectUri: undefined,
    logging: false,
    modules: [],
    // the following are not public and will probably be moved away from the
    // default config
    backgroundSyncInterval: 60000,
    disableFeatures: [],
    discoveryTimeout: 10000,
    isBackground: false,
    requestTimeout: 30000,
    syncInterval: 10000,
}

module.exports = config
