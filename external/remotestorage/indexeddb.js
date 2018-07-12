/**
 * TODO rewrite, doesn't expose GPD anymore, it's in cachinglayer now
 *
 * This file exposes a get/put/delete interface, accessing data in an IndexedDB.
 *
 * There are multiple parts to this interface:
 *
 *   The RemoteStorage integration:
 *     - IndexedDB._rs_supported() determines if IndexedDB support
 *       is available. If it isn't, RemoteStorage won't initialize the feature.
 *     - IndexedDB._rs_init() initializes the feature. It returns
 *       a promise that is fulfilled as soon as the database has been opened and
 *       migrated.
 *
 *   The storage interface (IndexedDB object):
 *     - Usually this is accessible via "remoteStorage.local"
 *     - #get() takes a path and returns a promise.
 *     - #put() takes a path, body and contentType and also returns a promise.
 *     - #delete() takes a path and also returns a promise.
 *     - #on('change', ...) events, being fired whenever something changes in
 *       the storage. Change events roughly follow the StorageEvent pattern.
 *       They have "oldValue" and "newValue" properties, which can be used to
 *       distinguish create/update/delete operations and analyze changes in
 *       change handlers. In addition they carry a "origin" property, which
 *       is either "window", "local", or "remote". "remote" events are fired
 *       whenever a change comes in from Sync.
 *
 *   The sync interface (also on IndexedDB object):
 *     - #getNodes([paths]) returns the requested nodes in a promise.
 *     - #setNodes(map) stores all the nodes given in the (path -> node) map.
 *
 * @interface
 */

var log = require('./log')
var cachingLayer = require('./cachinglayer')
var eventHandling = require('./eventhandling')
var util = require('./util')

var DB_VERSION = 2

var DEFAULT_DB_NAME = 'remotestorage'
var DEFAULT_DB

var IndexedDB = function(database) {
    this.db = database || DEFAULT_DB

    if (!this.db) {
        log('[IndexedDB] Failed to open DB')
        return undefined
    }

    cachingLayer(this)
    eventHandling(this, 'change', 'local-events-done')

    this.getsRunning = 0
    this.putsRunning = 0

    /**
     * Given a node for which uncommitted changes exist, this cache
     * stores either the entire uncommitted node, or false for a deletion.
     * The node's path is used as the key.
     *
     * changesQueued stores changes for which no IndexedDB transaction has
     * been started yet.
     */
    this.changesQueued = {}

    /**
     * Given a node for which uncommitted changes exist, this cache
     * stores either the entire uncommitted node, or false for a deletion.
     * The node's path is used as the key.
     *
     * At any time there is at most one IndexedDB transaction running.
     * changesRunning stores the changes that are included in that currently
     * running IndexedDB transaction, or if none is running, of the last one
     * that ran.
     */
    this.changesRunning = {}
}

IndexedDB.prototype = {
    /**
     * TODO: Document
     */
    getNodes: function(paths) {
        var misses = [],
            fromCache = {}
        for (let i = 0, len = paths.length; i < len; i++) {
            if (this.changesQueued[paths[i]] !== undefined) {
                fromCache[paths[i]] = util.deepClone(
                    this.changesQueued[paths[i]] || undefined,
                )
            } else if (this.changesRunning[paths[i]] !== undefined) {
                fromCache[paths[i]] = util.deepClone(
                    this.changesRunning[paths[i]] || undefined,
                )
            } else {
                misses.push(paths[i])
            }
        }
        if (misses.length > 0) {
            return this.getNodesFromDb(misses).then(function(nodes) {
                for (let i in fromCache) {
                    nodes[i] = fromCache[i]
                }
                return nodes
            })
        } else {
            return Promise.resolve(fromCache)
        }
    },

    /**
     * TODO: Document
     */
    setNodes: function(nodes) {
        for (var i in nodes) {
            this.changesQueued[i] = nodes[i] || false
        }
        this.maybeFlush()
        return Promise.resolve()
    },

    /**
     * TODO: Document
     */
    maybeFlush: function() {
        if (this.putsRunning === 0) {
            this.flushChangesQueued()
        } else {
            if (!this.commitSlownessWarning) {
                this.commitSlownessWarning = setInterval(function() {
                    console.warn(
                        'WARNING: waited more than 10 seconds for previous commit to finish',
                    )
                }, 10000)
            }
        }
    },

    /**
     * TODO: Document
     */
    flushChangesQueued: function() {
        if (this.commitSlownessWarning) {
            clearInterval(this.commitSlownessWarning)
            this.commitSlownessWarning = null
        }
        if (Object.keys(this.changesQueued).length > 0) {
            this.changesRunning = this.changesQueued
            this.changesQueued = {}
            this.setNodesInDb(this.changesRunning).then(
                this.flushChangesQueued.bind(this),
            )
        }
    },

    /**
     * TODO: Document
     */
    getNodesFromDb: function(paths) {
        return new Promise((resolve, reject) => {
            let transaction = this.db.transaction(['nodes'], 'readonly')
            let nodes = transaction.objectStore('nodes')
            let retrievedNodes = {}

            this.getsRunning++

            paths.map(function(path) {
                nodes.get(path).onsuccess = function(evt) {
                    retrievedNodes[path] = evt.target.result
                }
            })

            transaction.oncomplete = function() {
                resolve(retrievedNodes)
                this.getsRunning--
            }.bind(this)

            transaction.onerror = transaction.onabort = function() {
                reject('get transaction error/abort')
                this.getsRunning--
            }.bind(this)
        })
    },

    /**
     * TODO: Document
     */
    setNodesInDb: function(nodes) {
        return new Promise((resolve, reject) => {
            let transaction = this.db.transaction(['nodes'], 'readwrite')
            let nodesStore = transaction.objectStore('nodes')
            let startTime = new Date().getTime()

            this.putsRunning++

            log('[IndexedDB] Starting put', nodes, this.putsRunning)

            for (var path in nodes) {
                var node = nodes[path]
                if (typeof node === 'object') {
                    try {
                        nodesStore.put(node)
                    } catch (e) {
                        log('[IndexedDB] Error while putting', node, e)
                        throw e
                    }
                } else {
                    try {
                        nodesStore.delete(path)
                    } catch (e) {
                        log(
                            '[IndexedDB] Error while removing',
                            nodesStore,
                            node,
                            e,
                        )
                        throw e
                    }
                }
            }

            transaction.oncomplete = function() {
                this.putsRunning--
                log(
                    '[IndexedDB] Finished put',
                    nodes,
                    this.putsRunning,
                    new Date().getTime() - startTime + 'ms',
                )
                resolve()
            }.bind(this)

            transaction.onerror = function() {
                this.putsRunning--
                reject('transaction error')
            }.bind(this)

            transaction.onabort = function() {
                reject('transaction abort')
                this.putsRunning--
            }.bind(this)
        })
    },

    /**
     * TODO: Document
     */
    reset: function(callback) {
        let dbName = this.db.name

        this.db.close()

        IndexedDB.clean(this.db.name, () => {
            IndexedDB.open(dbName, (err, other) => {
                if (err) {
                    log('[IndexedDB] Error while resetting local storage', err)
                } else {
                    // hacky!
                    this.db = other
                }
                if (typeof callback === 'function') {
                    callback(self)
                }
            })
        })
    },

    /**
     * TODO: Document
     */
    forAllNodes: function(cb) {
        return new Promise((resolve /*, reject*/) => {
            let transaction = this.db.transaction(['nodes'], 'readonly')
            let cursorReq = transaction.objectStore('nodes').openCursor()

            cursorReq.onsuccess = evt => {
                let cursor = evt.target.result

                if (cursor) {
                    cb(this.migrate(cursor.value))
                    cursor.continue()
                } else {
                    resolve()
                }
            }
        })
    },

    closeDB: function() {
        if (this.putsRunning === 0) {
            // check if we are currently writing to the DB
            this.db.close()
        } else {
            setTimeout(this.closeDB.bind(this), 100) // try again a little later
        }
    },
}

/**
 * TODO: Document
 */
IndexedDB.open = function(name, callback) {
    var timer = setTimeout(function() {
        callback('timeout trying to open db')
    }, 10000)

    try {
        var req = indexedDB.open(name, DB_VERSION)

        req.onerror = function() {
            log('[IndexedDB] Opening DB failed', req)

            clearTimeout(timer)
            callback(req.error)
        }

        req.onupgradeneeded = function(event) {
            var db = req.result

            log(
                '[IndexedDB] Upgrade: from ',
                event.oldVersion,
                ' to ',
                event.newVersion,
            )

            if (event.oldVersion !== 1) {
                log('[IndexedDB] Creating object store: nodes')
                db.createObjectStore('nodes', { keyPath: 'path' })
            }

            log('[IndexedDB] Creating object store: changes')

            db.createObjectStore('changes', { keyPath: 'path' })
        }

        req.onsuccess = function() {
            clearTimeout(timer)

            // check if all object stores exist
            var db = req.result
            if (
                !db.objectStoreNames.contains('nodes') ||
                !db.objectStoreNames.contains('changes')
            ) {
                log('[IndexedDB] Missing object store. Resetting the database.')
                IndexedDB.clean(name, function() {
                    IndexedDB.open(name, callback)
                })
                return
            }

            callback(null, req.result)
        }
    } catch (error) {
        log('[IndexedDB] Failed to open database: ' + error)
        log('[IndexedDB] Resetting database and trying again.')

        clearTimeout(timer)

        IndexedDB.clean(name, function() {
            IndexedDB.open(name, callback)
        })
    }
}

/**
 * TODO: Document
 */
IndexedDB.clean = function(databaseName, callback) {
    var req = indexedDB.deleteDatabase(databaseName)

    req.onsuccess = function() {
        log('[IndexedDB] Done removing DB')
        callback()
    }

    req.onerror = req.onabort = function(evt) {
        console.error('Failed to remove database "' + databaseName + '"', evt)
    }
}

/**
 * Initialize the IndexedDB backend.
 *
 * @param {Object} remoteStorage - RemoteStorage instance
 *
 * @protected
 */
IndexedDB._rs_init = function(remoteStorage) {
    return new Promise((resolve, reject) => {
        IndexedDB.open(DEFAULT_DB_NAME, function(err, db) {
            if (err) {
                reject(err)
            } else {
                DEFAULT_DB = db
                db.onerror = function() {
                    remoteStorage._emit('error', err)
                }
                resolve()
            }
        })
    })
}

/**
 * Inform about the availability of the IndexedDB backend.
 *
 * @param {Object} rs - RemoteStorage instance
 * @returns {Boolean}
 *
 * @protected
 */
IndexedDB._rs_supported = function() {
    return new Promise((resolve, reject) => {
        var context = util.getGlobalContext()

        // FIXME: this is causing an error in chrome
        // context.indexedDB = context.indexedDB    || context.webkitIndexedDB ||
        //                    context.mozIndexedDB || context.oIndexedDB      ||
        //                    context.msIndexedDB;

        // Detect browsers with known IndexedDb issues (e.g. Android pre-4.4)
        var poorIndexedDbSupport = false
        if (
            typeof navigator !== 'undefined' &&
            navigator.userAgent.match(/Android (2|3|4\.[0-3])/)
        ) {
            // Chrome and Firefox support IndexedDB
            if (!navigator.userAgent.match(/Chrome|Firefox/)) {
                poorIndexedDbSupport = true
            }
        }

        if ('indexedDB' in context && !poorIndexedDbSupport) {
            try {
                var check = indexedDB.open('rs-check')
                check.onerror = function(/* event */) {
                    reject()
                }
                check.onsuccess = function(/* event */) {
                    check.result.close()
                    indexedDB.deleteDatabase('rs-check')
                    resolve()
                }
            } catch (e) {
                reject()
            }
        } else {
            reject()
        }
    })
}

/**
 * Remove IndexedDB as a backend.
 *
 * @param {Object} remoteStorage - RemoteStorage instance
 *
 * @protected
 */
IndexedDB._rs_cleanup = function(remoteStorage) {
    return new Promise((resolve /*, reject*/) => {
        if (remoteStorage.local) {
            remoteStorage.local.closeDB()
        }

        IndexedDB.clean(DEFAULT_DB_NAME, resolve)
    })
}

module.exports = IndexedDB
