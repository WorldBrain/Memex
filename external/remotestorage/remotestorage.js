'use strict'

const util = require('./util')
const Dropbox = require('./dropbox')
const GoogleDrive = require('./googledrive')
const Discover = require('./discover')
const BaseClient = require('./baseclient')
const config = require('./config')
const Authorize = require('./authorize')
const Sync = require('./sync')
const log = require('./log')
const Features = require('./features')
const globalContext = util.getGlobalContext()
const eventHandling = require('./eventhandling')

var hasLocalStorage

// TODO document and/or refactor (seems weird)
function emitUnauthorized(r) {
    if (r.statusCode === 403 || r.statusCode === 401) {
        this._emit('error', new Authorize.Unauthorized())
    }
    return Promise.resolve(r)
}

/**
 * Constructor for the remoteStorage object.
 *
 * This class primarily contains feature detection code and convenience API.
 *
 * Depending on which features are built in, it contains different attributes
 * and functions. See the individual features for more information.
 *
 * @param {object} config - an optional configuration object
 * @class
 */
var RemoteStorage = function(cfg) {
    // Initial configuration property settings.
    if (typeof cfg === 'object') {
        util.extend(config, cfg)
    }

    eventHandling(
        this,
        'ready',
        'authing',
        'connecting',
        'connected',
        'disconnected',
        'not-connected',
        'conflict',
        'error',
        'features-loaded',
        'sync-interval-change',
        'sync-req-done',
        'sync-done',
        'wire-busy',
        'wire-done',
        'network-offline',
        'network-online',
    )

    /**
     * Pending get/put/delete calls
     *
     * @private
     */
    this._pending = []

    /**
     * TODO: document
     *
     * @private
     */
    this._setGPD({
        get: this._pendingGPD('get'),
        put: this._pendingGPD('put'),
        delete: this._pendingGPD('delete'),
    })

    /**
     * TODO: document
     *
     * @private
     */
    this._cleanups = []

    /**
     * TODO: document
     *
     * @private
     */
    this._pathHandlers = { change: {} }

    /**
     * Holds OAuth app keys for Dropbox, Google Drive
     *
     * @private
     */
    this.apiKeys = {}

    hasLocalStorage = util.localStorageAvailable()

    if (hasLocalStorage) {
        try {
            this.apiKeys =
                JSON.parse(localStorage.getItem('remotestorage:api-keys')) || {}
        } catch (exc) {
            // ignored
        }
        this.setBackend(
            localStorage.getItem('remotestorage:backend') || 'remotestorage',
        )
    }

    // Keep a reference to the orginal `on` function
    var origOn = this.on

    /**
     * Register an event handler. See :ref:`rs-events` for available event names.
     *
     * @param {string} eventName - Name of the event
     * @param {function} handler - Event handler
     */
    this.on = function(eventName, handler) {
        if (this._allLoaded) {
            // check if the handler should be called immediately, because the
            // event has happened already
            switch (eventName) {
                case 'features-loaded':
                    setTimeout(handler, 0)
                    break
                case 'ready':
                    if (this.remote) {
                        setTimeout(handler, 0)
                    }
                    break
                case 'connected':
                    if (this.remote && this.remote.connected) {
                        setTimeout(handler, 0)
                    }
                    break
                case 'not-connected':
                    if (this.remote && !this.remote.connected) {
                        setTimeout(handler, 0)
                    }
                    break
            }
        }

        return origOn.call(this, eventName, handler)
    }

    // load all features and emit `ready`
    this._init()

    /**
     * TODO: document
     */
    this.fireInitial = function() {
        if (this.local) {
            setTimeout(this.local.fireInitial.bind(this.local), 0)
        }
    }.bind(this)

    this.on('ready', this.fireInitial.bind(this))
    this.loadModules()
}

// FIXME: Instead of doing this, would be better to only
// export setAuthURL / getAuthURL from RemoteStorage prototype
RemoteStorage.Authorize = Authorize

RemoteStorage.SyncError = Sync.SyncError
RemoteStorage.Unauthorized = Authorize.Unauthorized
RemoteStorage.DiscoveryError = Discover.DiscoveryError

RemoteStorage.prototype = {
    /**
     * Load all modules passed as arguments
     *
     * @private
     */
    loadModules: function loadModules() {
        config.modules.forEach(this.addModule.bind(this))
    },

    /**
     * TODO: document
     *
     * @param {string} authUrl
     * @param {string} cordovaRedirectUri
     */
    authorize: function authorize(authURL, cordovaRedirectUri) {
        this.access.setStorageType(this.remote.storageApi)
        var scope = this.access.scopeParameter

        var redirectUri = globalContext.cordova
            ? cordovaRedirectUri
            : String(Authorize.getLocation())

        var clientId = redirectUri.match(/^(https?:\/\/[^/]+)/)[0]

        Authorize(this, authURL, scope, redirectUri, clientId)
    },

    /**
     * TODO: document
     *
     * @private
     */
    impliedauth: function(storageApi, redirectUri) {
        storageApi = this.remote.storageApi
        redirectUri = String(document.location)

        log(
            'ImpliedAuth proceeding due to absent authURL; storageApi = ' +
                storageApi +
                ' redirectUri = ' +
                redirectUri,
        )
        // Set a fixed access token, signalling to not send it as Bearer
        this.remote.configure({
            token: Authorize.IMPLIED_FAKE_TOKEN,
        })
        document.location = redirectUri
    },

    /**
     * @property {object} remote
     *
     * Depending on the chosen backend, this is either an instance of ``WireClient``,
     * ``Dropbox`` or ``GoogleDrive``.
     *
     * @property {boolean} remote.connected - Whether or not a remote store is connected
     * @property {boolean} remote.online - Whether last sync action was successful or not
     * @property {string} remote.userAddress - The user address of the connected user
     * @property {string} remote.properties - The properties of the WebFinger link
     */

    /**
     * Connect to a remoteStorage server.
     *
     * Discovers the WebFinger profile of the given user address and initiates
     * the OAuth dance.
     *
     * This method must be called *after* all required access has been claimed.
     * When using the connect widget, it will call this method itself.
     *
     * Special cases:
     *
     * 1. If a bearer token is supplied as second argument, the OAuth dance
     *    will be skipped and the supplied token be used instead. This is
     *    useful outside of browser environments, where the token has been
     *    acquired in a different way.
     *
     * 2. If the Webfinger profile for the given user address doesn't contain
     *    an auth URL, the library will assume that client and server have
     *    established authorization among themselves, which will omit bearer
     *    tokens in all requests later on. This is useful for example when using
     *    Kerberos and similar protocols.
     *
     * @param {string} userAddress - The user address (user@host) to connect to.
     * @param {string} token       - (optional) A bearer token acquired beforehand
     */
    connect: function(userAddress, token) {
        this.setBackend('remotestorage')
        if (userAddress.indexOf('@') < 0) {
            this._emit(
                'error',
                new RemoteStorage.DiscoveryError(
                    "User address doesn't contain an @.",
                ),
            )
            return
        }

        if (globalContext.cordova) {
            if (typeof config.cordovaRedirectUri !== 'string') {
                this._emit(
                    'error',
                    new RemoteStorage.DiscoveryError(
                        'Please supply a custom HTTPS redirect URI for your Cordova app',
                    ),
                )
                return
            }
            if (!globalContext.cordova.InAppBrowser) {
                this._emit(
                    'error',
                    new RemoteStorage.DiscoveryError(
                        'Please include the InAppBrowser Cordova plugin to enable OAuth',
                    ),
                )
                return
            }
        }

        this.remote.configure({
            userAddress: userAddress,
        })
        this._emit('connecting')

        var discoveryTimeout = setTimeout(
            function() {
                this._emit(
                    'error',
                    new RemoteStorage.DiscoveryError(
                        'No storage information found for this user address.',
                    ),
                )
            }.bind(this),
            config.discoveryTimeout,
        )

        Discover(userAddress).then(
            info => {
                // Info contains fields: href, storageApi, authURL (optional), properties

                clearTimeout(discoveryTimeout)
                this._emit('authing')
                info.userAddress = userAddress
                this.remote.configure(info)
                if (!this.remote.connected) {
                    if (info.authURL) {
                        if (typeof token === 'undefined') {
                            // Normal authorization step; the default way to connect
                            this.authorize(
                                info.authURL,
                                config.cordovaRedirectUri,
                            )
                        } else if (typeof token === 'string') {
                            // Token supplied directly by app/developer/user
                            log(
                                'Skipping authorization sequence and connecting with known token',
                            )
                            this.remote.configure({ token: token })
                        } else {
                            throw new Error(
                                'Supplied bearer token must be a string',
                            )
                        }
                    } else {
                        // In lieu of an excplicit authURL, assume that the browser and
                        // server handle any authorization needs; for instance, TLS may
                        // trigger the browser to use a client certificate, or a 401 Not
                        // Authorized response may make the browser send a Kerberos ticket
                        // using the SPNEGO method.
                        this.impliedauth()
                    }
                }
            },
            (/*err*/) => {
                clearTimeout(discoveryTimeout)
                this._emit(
                    'error',
                    new RemoteStorage.DiscoveryError(
                        'No storage information found for this user address.',
                    ),
                )
            },
        )
    },

    /**
     * Reconnect the remote server to get a new authorization.
     */
    reconnect: function() {
        this.remote.configure({ token: null })

        if (this.backend === 'remotestorage') {
            this.connect(this.remote.userAddress)
        } else {
            this.remote.connect()
        }
    },

    /**
     * "Disconnect" from remote server to terminate current session.
     *
     * This method clears all stored settings and deletes the entire local
     * cache.
     */
    disconnect: function() {
        if (this.remote) {
            this.remote.configure({
                userAddress: null,
                href: null,
                storageApi: null,
                token: null,
                properties: null,
            })
        }
        this._setGPD({
            get: this._pendingGPD('get'),
            put: this._pendingGPD('put'),
            delete: this._pendingGPD('delete'),
        })
        var n = this._cleanups.length,
            i = 0

        var oneDone = function() {
            i++
            if (i >= n) {
                this._init()
                log(
                    'Done cleaning up, emitting disconnected and disconnect events',
                )
                this._emit('disconnected')
            }
        }.bind(this)

        if (n > 0) {
            this._cleanups.forEach(
                function(cleanup) {
                    var cleanupResult = cleanup(this)
                    if (
                        typeof cleanupResult === 'object' &&
                        typeof cleanupResult.then === 'function'
                    ) {
                        cleanupResult.then(oneDone)
                    } else {
                        oneDone()
                    }
                }.bind(this),
            )
        } else {
            oneDone()
        }
    },

    /**
     * TODO: document
     *
     * @private
     */
    setBackend: function(what) {
        this.backend = what
        if (hasLocalStorage) {
            if (what) {
                localStorage.setItem('remotestorage:backend', what)
            } else {
                localStorage.removeItem('remotestorage:backend')
            }
        }
    },

    /**
     * Add a "change" event handler to the given path. Whenever a "change"
     * happens (as determined by the backend, such as e.g.
     * <RemoteStorage.IndexedDB>) and the affected path is equal to or below the
     * given 'path', the given handler is called.
     *
     * You should usually not use this method directly, but instead use the
     * "change" events provided by :doc:`BaseClient </js-api/base-client>`
     *
     * @param {string} path - Absolute path to attach handler to
     * @param {function} handler - Handler function
     */
    onChange: function(path, handler) {
        if (!this._pathHandlers.change[path]) {
            this._pathHandlers.change[path] = []
        }
        this._pathHandlers.change[path].push(handler)
    },

    /**
     * TODO: do we still need this, now that we always instantiate the prototype?
     *
     * Enable remoteStorage logging.
     */
    enableLog: function() {
        config.logging = true
    },

    /**
     * TODO: do we still need this, now that we always instantiate the prototype?
     *
     * Disable remoteStorage logging
     */
    disableLog: function() {
        config.logging = false
    },

    /**
     * log
     *
     * The same as <RemoteStorage.log>.
     */
    log: function() {
        log.apply(RemoteStorage, arguments)
    },

    /**
     * Set the OAuth key/ID for either GoogleDrive or Dropbox backend support.
     *
     * @param {Object} apiKeys - A config object with these properties:
     * @param {string} [apiKeys.type] - Backend type: 'googledrive' or 'dropbox'
     * @param {string} [apiKeys.key] - Client ID for GoogleDrive, or app key for Dropbox
     */
    setApiKeys: function(apiKeys) {
        const validTypes = ['googledrive', 'dropbox']
        if (
            typeof apiKeys !== 'object' ||
            !Object.keys(apiKeys).every(type => validTypes.includes(type))
        ) {
            console.error('setApiKeys() was called with invalid arguments')
            return false
        }

        Object.keys(apiKeys).forEach(type => {
            let key = apiKeys[type]
            if (!key) {
                delete this.apiKeys[type]
                return
            }

            switch (type) {
                case 'dropbox':
                    this.apiKeys['dropbox'] = { appKey: key }
                    if (
                        typeof this.dropbox === 'undefined' ||
                        this.dropbox.clientId !== key
                    ) {
                        Dropbox._rs_init(this)
                    }
                    break
                case 'googledrive':
                    this.apiKeys['googledrive'] = { clientId: key }
                    if (
                        typeof this.googledrive === 'undefined' ||
                        this.googledrive.clientId !== key
                    ) {
                        GoogleDrive._rs_init(this)
                    }
                    break
            }
            return true
        })

        if (hasLocalStorage) {
            localStorage.setItem(
                'remotestorage:api-keys',
                JSON.stringify(this.apiKeys),
            )
        }
    },

    /**
     * Set redirect URI to be used for the OAuth redirect within the
     * in-app-browser window in Cordova apps.
     *
     * @param {string} uri - A valid HTTP(S) URI
     */
    setCordovaRedirectUri: function(uri) {
        if (typeof uri !== 'string' || !uri.match(/http(s)?:\/\//)) {
            throw new Error('Cordova redirect URI must be a URI string')
        }
        config.cordovaRedirectUri = uri
    },

    //
    // FEATURES INITIALIZATION
    //

    _init: Features.loadFeatures,
    features: Features.features,
    loadFeature: Features.loadFeature,
    featureSupported: Features.featureSupported,
    featureDone: Features.featureDone,
    featuresDone: Features.featuresDone,
    featuresLoaded: Features.featuresLoaded,
    featureInitialized: Features.featureInitialized,
    featureFailed: Features.featureFailed,
    hasFeature: Features.hasFeature,
    _setCachingModule: Features._setCachingModule,
    _collectCleanupFunctions: Features._collectCleanupFunctions,
    _fireReady: Features._fireReady,
    initFeature: Features.initFeature,

    //
    // GET/PUT/DELETE INTERFACE HELPERS
    //

    /**
     * TODO: document
     *
     * @private
     */
    _setGPD: function(impl, context) {
        function wrap(func) {
            return function() {
                return func
                    .apply(context, arguments)
                    .then(emitUnauthorized.bind(this))
            }
        }
        this.get = wrap(impl.get)
        this.put = wrap(impl.put)
        this.delete = wrap(impl.delete)
    },

    /**
     * TODO: document
     *
     * @private
     */
    _pendingGPD: function(methodName) {
        return function() {
            var methodArguments = Array.prototype.slice.call(arguments)
            return new Promise(
                function(resolve, reject) {
                    this._pending.push({
                        method: methodName,
                        args: methodArguments,
                        promise: {
                            resolve: resolve,
                            reject: reject,
                        },
                    })
                }.bind(this),
            )
        }.bind(this)
    },

    /**
     * TODO: document
     *
     * @private
     */
    _processPending: function() {
        this._pending.forEach(
            function(pending) {
                try {
                    this[pending.method]
                        .apply(this, pending.args)
                        .then(pending.promise.resolve, pending.promise.reject)
                } catch (e) {
                    pending.promise.reject(e)
                }
            }.bind(this),
        )
        this._pending = []
    },

    //
    // CHANGE EVENT HANDLING
    //

    /**
     * TODO: document
     *
     * @private
     */
    _bindChange: function(object) {
        object.on('change', this._dispatchEvent.bind(this, 'change'))
    },

    /**
     * TODO: document
     *
     * @private
     */
    _dispatchEvent: function(eventName, event) {
        var self = this
        Object.keys(this._pathHandlers[eventName]).forEach(function(path) {
            var pl = path.length
            if (event.path.substr(0, pl) === path) {
                self._pathHandlers[eventName][path].forEach(function(handler) {
                    var ev = {}
                    for (var key in event) {
                        ev[key] = event[key]
                    }
                    ev.relativePath = event.path.replace(
                        new RegExp('^' + path),
                        '',
                    )
                    try {
                        handler(ev)
                    } catch (e) {
                        console.error("'change' handler failed: ", e, e.stack)
                        self._emit('error', e)
                    }
                })
            }
        })
    },

    /**
     * This method enables you to quickly instantiate a BaseClient, which you can
     * use to directly read and manipulate data in the connected storage account.
     *
     * Please use this method only for debugging and development, and choose or
     * create a :doc:`data module </data-modules>` for your app to use.
     *
     * @param {string} path - The base directory of the BaseClient that will be
     *                         returned (with a leading and a trailing slash)
     *
     * @returns {BaseClient} A client with the specified scope (category/base directory)
     */
    scope: function(path) {
        if (typeof path !== 'string') {
            throw "Argument 'path' of baseClient.scope must be a string"
        }

        if (!this.access.checkPathPermission(path, 'r')) {
            var escapedPath = path.replace(/(['\\])/g, '\\$1')
            console.warn(
                "WARNING: please call remoteStorage.access.claim('" +
                    escapedPath +
                    "', 'r') (read only) or remoteStorage.access.claim('" +
                    escapedPath +
                    "', 'rw') (read/write) first",
            )
        }
        return new BaseClient(this, path)
    },

    /**
     * Get the value of the sync interval when application is in the foreground
     *
     * @returns {number} A number of milliseconds
     */
    getSyncInterval: function() {
        return config.syncInterval
    },

    /**
     * Set the value of the sync interval when application is in the foreground
     *
     * @param {number} interval - Sync interval in milliseconds (between 1000 and 3600000)
     */
    setSyncInterval: function(interval) {
        if (!isValidInterval(interval)) {
            throw interval + ' is not a valid sync interval'
        }
        var oldValue = config.syncInterval
        config.syncInterval = parseInt(interval, 10)
        this._emit('sync-interval-change', {
            oldValue: oldValue,
            newValue: interval,
        })
    },

    /**
     * Get the value of the sync interval when application is in the background
     *
     * @returns {number} A number of milliseconds
     */
    getBackgroundSyncInterval: function() {
        return config.backgroundSyncInterval
    },

    /**
     * Set the value of the sync interval when the application is in the
     * background
     *
     * @param interval - Sync interval in milliseconds (between 1000 and 3600000)
     */
    setBackgroundSyncInterval: function(interval) {
        if (!isValidInterval(interval)) {
            throw interval + ' is not a valid sync interval'
        }
        var oldValue = config.backgroundSyncInterval
        config.backgroundSyncInterval = parseInt(interval, 10)
        this._emit('sync-interval-change', {
            oldValue: oldValue,
            newValue: interval,
        })
    },

    /**
     * Get the value of the current sync interval. Can be background or
     * foreground, custom or default.
     *
     * @returns {number} A number of milliseconds
     */
    getCurrentSyncInterval: function() {
        return config.isBackground
            ? config.backgroundSyncInterval
            : config.syncInterval
    },

    /**
     * Get the value of the current network request timeout
     *
     * @returns {number} A number of milliseconds
     */
    getRequestTimeout: function() {
        return config.requestTimeout
    },

    /**
     * Set the timeout for network requests.
     *
     * @param timeout - Timeout in milliseconds
     */
    setRequestTimeout: function(timeout) {
        config.requestTimeout = parseInt(timeout, 10)
    },

    /**
     * TODO: document
     *
     * @private
     */
    syncCycle: function() {
        if (!this.sync || this.sync.stopped) {
            return
        }

        this.on(
            'sync-done',
            function() {
                log(
                    '[Sync] Sync done. Setting timer to',
                    this.getCurrentSyncInterval(),
                )
                if (this.sync && !this.sync.stopped) {
                    if (this._syncTimer) {
                        clearTimeout(this._syncTimer)
                        this._syncTimer = undefined
                    }
                    this._syncTimer = setTimeout(
                        this.sync.sync.bind(this.sync),
                        this.getCurrentSyncInterval(),
                    )
                }
            }.bind(this),
        )

        this.sync.sync()
    },

    /**
     * Start synchronization with remote storage, downloading and uploading any
     * changes within the cached paths.
     *
     * Please consider: local changes will attempt sync immediately, and remote
     * changes should also be synced timely when using library defaults. So
     * this is mostly useful for letting users sync manually, when pressing a
     * sync button for example. This might feel safer to them sometimes, esp.
     * when shifting between offline and online a lot.
     *
     * @returns {Promise} A Promise which resolves when the sync has finished
     */
    startSync: function() {
        if (!config.cache) {
            console.warn('Nothing to sync, because caching is disabled.')
            return Promise.resolve()
        }
        this.sync.stopped = false
        this.syncStopped = false
        return this.sync.sync()
    },

    /**
     * Stop the periodic synchronization.
     */
    stopSync: function() {
        clearTimeout(this._syncTimer)
        this._syncTimer = undefined

        if (this.sync) {
            log('[Sync] Stopping sync')
            this.sync.stopped = true
        } else {
            // The sync class has not been initialized yet, so we make sure it will
            // not start the syncing process as soon as it's initialized.
            log('[Sync] Will instantiate sync stopped')
            this.syncStopped = true
        }
    },
}

/**
 * Check if interval is valid: numeric and between 1000ms and 3600000ms
 *
 * @private
 */
function isValidInterval(interval) {
    return typeof interval === 'number' && interval > 1000 && interval < 3600000
}

RemoteStorage.util = util

/**
 * @property connected
 *
 * Boolean property indicating if remoteStorage is currently connected.
 */
Object.defineProperty(RemoteStorage.prototype, 'connected', {
    get: function() {
        return this.remote.connected
    },
})

/**
 * @property access
 *
 * Tracking claimed access scopes. A <RemoteStorage.Access> instance.
 */
var Access = require('./access')
Object.defineProperty(RemoteStorage.prototype, 'access', {
    get: function() {
        var access = new Access()
        Object.defineProperty(this, 'access', {
            value: access,
        })
        return access
    },
    configurable: true,
})

// TODO Clean up/harmonize how modules are loaded and/or document this architecture properly
//
// At this point the remoteStorage object has not been created yet.
// Only its prototype exists so far, so we define a self-constructing
// property on there:

/**
 * Property: caching
 *
 * Caching settings. A <RemoteStorage.Caching> instance.
 */

// FIXME Was in rs_init of Caching but don't want to require RemoteStorage from there.
var Caching = require('./caching')
Object.defineProperty(RemoteStorage.prototype, 'caching', {
    configurable: true,
    get: function() {
        var caching = new Caching()
        Object.defineProperty(this, 'caching', {
            value: caching,
        })
        return caching
    },
})

/*
 * @property local
 *
 * Access to the local caching backend used. Usually either a
 * <RemoteStorage.IndexedDB> or <RemoteStorage.LocalStorage> instance.
 *
 * Not available, when caching is turned off.
 */

module.exports = RemoteStorage
require('./modules')
