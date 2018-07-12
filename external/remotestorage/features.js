'use strict'

const util = require('./util')
const log = require('./log')
const SyncedGetPutDelete = require('./syncedgetputdelete')
const config = require('./config')

const Features = {
    features: [],
    featuresDone: 0,
    readyFired: false,

    loadFeatures() {
        this.features = []
        this.featuresDone = 0
        this.readyFired = false

        this.featureModules = {
            WireClient: require('./wireclient'),
            Dropbox: require('./dropbox'),
            GoogleDrive: require('./googledrive'),
            Access: require('./access'),
            Discover: require('./discover'),
            Authorize: require('./authorize'),
            BaseClient: require('./baseclient'),
            Env: require('./env'),
        }

        // enable caching related modules if needed
        if (config.cache) {
            util.extend(this.featureModules, {
                Caching: require('./caching'),
                IndexedDB: require('./indexeddb'),
                LocalStorage: require('./localstorage'),
                InMemoryStorage: require('./inmemorystorage'),
                Sync: require('./sync'),
            })
        }

        // disable features set in the config object passed to the RemoteStorage
        // constructor
        // For example: ['IndexedDB']
        config.disableFeatures.forEach(feature => {
            if (this.featureModules[feature]) {
                // this.featureModules[feature] = undefined
                delete this.featureModules[feature]
            }
        })

        this._allLoaded = false

        for (let featureName in this.featureModules) {
            // FIXME: this has to push the promised return value into an
            // array of promises and use Promise.all to emit `ready`
            // instead of increment a counter of loaded features. -les
            this.loadFeature(featureName)
        }
    },

    /**
     * Method: hasFeature
     *
     * Checks whether a feature is enabled or not within remoteStorage.
     * Returns a boolean.
     *
     * Parameters:
     *   name - Capitalized name of the feature. e.g. Authorize, or IndexedDB
     *
     * Example:
     *   (start code)
     *   if (remoteStorage.hasFeature('LocalStorage')) {
     *     console.log('LocalStorage is enabled!');
     *   }
     *   (end code)
     *
     */
    hasFeature(feature) {
        for (var i = this.features.length - 1; i >= 0; i--) {
            if (this.features[i].name === feature) {
                return this.features[i].supported
            }
        }
        return false
    },

    loadFeature(featureName) {
        const feature = this.featureModules[featureName]
        let supported = !feature._rs_supported || feature._rs_supported()

        log(`[RemoteStorage] [FEATURE ${featureName}] initializing ...`)

        if (typeof supported === 'object') {
            supported.then(
                () => {
                    this.featureSupported(featureName, true)
                    this.initFeature(featureName)
                },
                () => {
                    this.featureSupported(featureName, false)
                },
            )
        } else if (typeof supported === 'boolean') {
            this.featureSupported(featureName, supported)
            if (supported) {
                this.initFeature(featureName)
            }
        } else {
            this.featureSupported(featureName, false)
        }
    },

    initFeature(featureName) {
        const feature = this.featureModules[featureName]
        let initResult
        try {
            initResult = feature._rs_init(this)
        } catch (e) {
            this.featureFailed(featureName, e)
            return
        }

        if (
            typeof initResult === 'object' &&
            typeof initResult.then === 'function'
        ) {
            initResult.then(
                () => {
                    this.featureInitialized(featureName)
                },
                err => {
                    this.featureFailed(featureName, err)
                },
            )
        } else {
            this.featureInitialized(featureName)
        }
    },

    featureFailed(featureName, err) {
        log(
            `[RemoteStorage] [FEATURE ${featureName}] initialization failed (${err})`,
        )
        this.featureDone()
    },

    featureSupported(featureName, success) {
        log(
            `[RemoteStorage] [FEATURE ${featureName}]  ${
                success ? '' : ' not'
            } supported`,
        )
        if (!success) {
            this.featureDone()
        }
    },

    featureInitialized(featureName) {
        log(`[RemoteStorage] [FEATURE ${featureName}] initialized.`)
        this.features.push({
            name: featureName,
            init: this.featureModules[featureName]._rs_init,
            supported: true,
            cleanup: this.featureModules[featureName]._rs_cleanup,
        })
        this.featureDone()
    },

    featureDone() {
        this.featuresDone++
        if (this.featuresDone === Object.keys(this.featureModules).length) {
            setTimeout(this.featuresLoaded.bind(this), 0)
        }
    },

    _setCachingModule() {
        const cachingModules = ['IndexedDB', 'LocalStorage', 'InMemoryStorage']

        cachingModules.some(cachingLayer => {
            if (this.features.some(feature => feature.name === cachingLayer)) {
                this.features.local = this.featureModules[cachingLayer]
                return true
            }
        })
    },

    _fireReady() {
        try {
            if (!this.readyFired) {
                this._emit('ready')
                this.readyFired = true
            }
        } catch (e) {
            console.error("'ready' failed: ", e, e.stack)
            this._emit('error', e)
        }
    },

    featuresLoaded() {
        log(`[REMOTESTORAGE] All features loaded !`)

        this._setCachingModule()
        // eslint-disable-next-line new-cap
        this.local =
            config.cache && this.features.local && new this.features.local()

        // this.remote set by WireClient._rs_init as lazy property on
        // RS.prototype

        if (this.local && this.remote) {
            this._setGPD(SyncedGetPutDelete, this)
            this._bindChange(this.local)
        } else if (this.remote) {
            this._setGPD(this.remote, this.remote)
        }
        if (this.remote) {
            this.remote.on('connected', () => {
                this._fireReady()
                this._emit('connected')
            })
            this.remote.on('not-connected', () => {
                this._fireReady()
                this._emit('not-connected')
            })
            if (this.remote.connected) {
                this._fireReady()
                this._emit('connected')
            }

            if (!this.hasFeature('Authorize')) {
                this.remote.stopWaitingForToken()
            }
        }

        this._collectCleanupFunctions()

        try {
            this._allLoaded = true
            this._emit('features-loaded')
        } catch (exc) {
            util.logError(exc)
            this._emit('error', exc)
        }
        this._processPending()
    },

    _collectCleanupFunctions() {
        this._cleanups = []
        for (let i = 0; i < this.features.length; i++) {
            let cleanup = this.features[i].cleanup
            if (typeof cleanup === 'function') {
                this._cleanups.push(cleanup)
            }
        }
    },
}

module.exports = Features
