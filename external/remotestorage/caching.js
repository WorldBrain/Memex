/**
 * @class Caching
 *
 * Holds/manages caching configuration.
 **/

var util = require('./util')
var log = require('./log')

var containingFolder = util.containingFolder

var Caching = function() {
    this.reset()
}

Caching.prototype = {
    pendingActivations: [],

    /**
     * Configure caching for a given path explicitly.
     *
     * Not needed when using ``enable``/``disable``.
     *
     * @param {string} path - Path to cache
     * @param {string} strategy - Caching strategy. One of 'ALL', 'SEEN', or 'FLUSH'.
     *
     */
    set: function(path, strategy) {
        if (typeof path !== 'string') {
            throw new Error('path should be a string')
        }
        if (!util.isFolder(path)) {
            throw new Error('path should be a folder')
        }
        if (
            this._remoteStorage &&
            this._remoteStorage.access &&
            !this._remoteStorage.access.checkPathPermission(path, 'r')
        ) {
            throw new Error(
                'No access to path "' +
                    path +
                    '". You have to claim access to it first.',
            )
        }
        if (!strategy.match(/^(FLUSH|SEEN|ALL)$/)) {
            throw new Error("strategy should be 'FLUSH', 'SEEN', or 'ALL'")
        }

        this._rootPaths[path] = strategy

        if (strategy === 'ALL') {
            if (this.activateHandler) {
                this.activateHandler(path)
            } else {
                this.pendingActivations.push(path)
            }
        }
    },

    /**
     * Enable caching for a given path.
     *
     * Uses caching strategy ``ALL``.
     *
     * @param {string} path - Path to enable caching for
     */
    enable: function(path) {
        this.set(path, 'ALL')
    },

    /**
     * Disable caching for a given path.
     *
     * Uses caching strategy ``FLUSH`` (meaning items are only cached until
     * successfully pushed to the remote).
     *
     * @param {string} path - Path to disable caching for
     */
    disable: function(path) {
        this.set(path, 'FLUSH')
    },

    /**
     * Set a callback for when caching is activated for a path.
     *
     * @param {function} callback - Callback function
     */
    onActivate: function(cb) {
        var i
        log('[Caching] Setting activate handler', cb, this.pendingActivations)
        this.activateHandler = cb
        for (i = 0; i < this.pendingActivations.length; i++) {
            cb(this.pendingActivations[i])
        }
        delete this.pendingActivations
    },

    /**
     * Retrieve caching setting for a given path, or its next parent
     * with a caching strategy set.
     *
     * @param {string} path - Path to retrieve setting for
     * @returns {string} caching strategy for the path
     **/
    checkPath: function(path) {
        if (this._rootPaths[path] !== undefined) {
            return this._rootPaths[path]
        } else if (path === '/') {
            return 'SEEN'
        } else {
            return this.checkPath(containingFolder(path))
        }
    },

    /**
     * Reset the state of caching by deleting all caching information.
     **/
    reset: function() {
        this._rootPaths = {}
        this._remoteStorage = null
    },
}

/**
 * Setup function that is called on initialization.
 *
 * @private
 **/
Caching._rs_init = function(remoteStorage) {
    this._remoteStorage = remoteStorage
}

module.exports = Caching
