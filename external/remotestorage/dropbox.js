var Authorize = require('./authorize')
var BaseClient = require('./baseclient')
var WireClient = require('./wireclient')
var util = require('./util')
var eventHandling = require('./eventhandling')
var Sync = require('./sync')

/**
 * WORK IN PROGRESS, NOT RECOMMENDED FOR PRODUCTION USE
 *
 * Dropbox backend for RemoteStorage.js
 * This file exposes a get/put/delete interface which is compatible with
 * <WireClient>.
 *
 * When remoteStorage.backend is set to 'dropbox', this backend will
 * initialize and replace remoteStorage.remote with remoteStorage.dropbox.
 *
 * In order to ensure compatibility with the public folder, <BaseClient.getItemURL>
 * gets hijacked to return the Dropbox public share URL.
 *
 * To use this backend, you need to specify the Dropbox app key like so:
 *
 * @example
 * remoteStorage.setApiKeys({
 *   dropbox: 'your-app-key'
 * });
 *
 * An app key can be obtained by registering your app at https://www.dropbox.com/developers/apps
 *
 * Known issues:
 *
 *   - Storing files larger than 150MB is not yet supported
 *   - Listing and deleting folders with more than 10'000 files will cause problems
 *   - Content-Type is not fully supported due to limitations of the Dropbox API
 *   - Dropbox preserves cases but is not case-sensitive
 *   - getItemURL is asynchronous which means it returns useful values
 *     after the syncCycle
 */

let hasLocalStorage
const AUTH_URL = 'https://www.dropbox.com/oauth2/authorize'
const SETTINGS_KEY = 'remotestorage:dropbox'
const PATH_PREFIX = '/remotestorage'

const isFolder = util.isFolder
const cleanPath = util.cleanPath
const shouldBeTreatedAsBinary = util.shouldBeTreatedAsBinary
const readBinaryData = util.readBinaryData

/**
 * Map a local path to a path in Dropbox.
 *
 * @param {string} path - Path
 * @returns {string} Actual path in Dropbox
 *
 * @private
 */
var getDropboxPath = function(path) {
    return cleanPath(PATH_PREFIX + '/' + path).replace(/\/$/, '')
}

var compareApiError = function(response, expect) {
    return new RegExp('^' + expect.join('\\/') + '(\\/|$)').test(
        response.error_summary,
    )
}

const isBinaryData = function(data) {
    return data instanceof ArrayBuffer || WireClient.isArrayBufferView(data)
}

/**
 * A cache which automatically converts all keys to lower case and can
 * propagate changes up to parent folders.
 *
 * By default the set and delete methods are aliased to justSet and justDelete.
 *
 * @param defaultValue {string} the value that is returned for all keys that don't exist
 *                              in the cache
 *
 * @class
 *
 */
function LowerCaseCache(defaultValue) {
    this.defaultValue = defaultValue
    this._storage = {}
    this.set = this.justSet
    this.delete = this.justDelete
}

LowerCaseCache.prototype = {
    /**
     * Get a value from the cache or defaultValue, if the key is not in the
     * cache.
     *
     * @protected
     */
    get: function(key) {
        key = key.toLowerCase()
        var stored = this._storage[key]
        if (typeof stored === 'undefined') {
            stored = this.defaultValue
            this._storage[key] = stored
        }
        return stored
    },

    /**
     * Set a value and also update the parent folders with that value.
     */
    propagateSet: function(key, value) {
        key = key.toLowerCase()
        if (this._storage[key] === value) {
            return value
        }
        this._propagate(key, value)
        this._storage[key] = value
        return value
    },

    /**
     * Delete a value and propagate the changes to the parent folders.
     */
    propagateDelete: function(key) {
        key = key.toLowerCase()
        this._propagate(key, this._storage[key])
        return delete this._storage[key]
    },

    _activatePropagation: function() {
        this.set = this.propagateSet
        this.delete = this.propagateDelete
        return true
    },

    /**
     * Set a value without propagating.
     */
    justSet: function(key, value) {
        key = key.toLowerCase()
        this._storage[key] = value
        return value
    },

    /**
     * Delete a key without propagating.
     */
    justDelete: function(key) {
        key = key.toLowerCase()
        return delete this._storage[key]
    },

    _propagate: function(key, rev) {
        var folders = key.split('/').slice(0, -1)
        var path = ''

        for (var i = 0, len = folders.length; i < len; i++) {
            path += folders[i] + '/'
            if (!rev) {
                rev = this._storage[path] + 1
            }
            this._storage[path] = rev
        }
    },
}

/**
 * @class
 */
var Dropbox = function(rs) {
    this.rs = rs
    this.connected = false
    this.rs = rs

    eventHandling(this, 'connected', 'not-connected')

    this.clientId = rs.apiKeys.dropbox.appKey
    this._revCache = new LowerCaseCache('rev')
    this._itemRefs = {}

    hasLocalStorage = util.localStorageAvailable()

    if (hasLocalStorage) {
        var settings
        try {
            settings = JSON.parse(localStorage.getItem(SETTINGS_KEY))
        } catch (e) {
            /* ok to ignore, probably no data in localStorage */
        }
        if (settings) {
            this.configure(settings)
        }
        try {
            this._itemRefs =
                JSON.parse(localStorage.getItem(SETTINGS_KEY + ':shares')) || {}
        } catch (e) {
            /* ok to ignore, no shares in localStorage */
        }
    }
    if (this.connected) {
        setTimeout(this._emit.bind(this), 0, 'connected')
    }
}

Dropbox.prototype = {
    online: true,

    /**
     * Set the backed to 'dropbox' and start the authentication flow in order
     * to obtain an API token from Dropbox.
     */
    connect: function() {
        // TODO handling when token is already present
        this.rs.setBackend('dropbox')
        if (this.token) {
            hookIt(this.rs)
        } else {
            Authorize(
                this.rs,
                AUTH_URL,
                '',
                String(Authorize.getLocation()),
                this.clientId,
            )
        }
    },

    /**
     * Sets the connected flag
     * Accepts its parameters according to the <WireClient>.
     * @param {Object} settings
     * @param {string} [settings.userAddress] - The user's email address
     * @param {string} [settings.token] - Authorization token
     *
     * @protected
     **/
    configure: function(settings) {
        // We only update this.userAddress if settings.userAddress is set to a string or to null:
        if (typeof settings.userAddress !== 'undefined') {
            this.userAddress = settings.userAddress
        }
        // Same for this.token. If only one of these two is set, we leave the other one at its existing value:
        if (typeof settings.token !== 'undefined') {
            this.token = settings.token
        }

        var writeSettingsToCache = function() {
            if (hasLocalStorage) {
                localStorage.setItem(
                    SETTINGS_KEY,
                    JSON.stringify({
                        userAddress: this.userAddress,
                        token: this.token,
                    }),
                )
            }
        }

        var handleError = function() {
            this.connected = false
            if (hasLocalStorage) {
                localStorage.removeItem(SETTINGS_KEY)
            }
        }

        if (this.token) {
            this.connected = true
            if (this.userAddress) {
                this._emit('connected')
                writeSettingsToCache.apply(this)
            } else {
                this.info()
                    .then(
                        function(info) {
                            this.userAddress = info.email
                            this._emit('connected')
                            writeSettingsToCache.apply(this)
                        }.bind(this),
                    )
                    .catch(
                        function() {
                            handleError.apply(this)
                            this.rs._emit(
                                'error',
                                new Error('Could not fetch user info.'),
                            )
                        }.bind(this),
                    )
            }
        } else {
            handleError.apply(this)
        }
    },

    /**
     * Stop waiting for the token and emit not-connected
     *
     * @protected
     */
    stopWaitingForToken: function() {
        if (!this.connected) {
            this._emit('not-connected')
        }
    },

    /**
     * Get all items in a folder.
     *
     * @param path {string} - path of the folder to get, with leading slash
     * @return {Object}
     *         statusCode - HTTP status code
     *         body - array of the items found
     *         contentType - 'application/json; charset=UTF-8'
     *         revision - revision of the folder
     *
     * @private
     */
    _getFolder: function(path) {
        var url = 'https://api.dropboxapi.com/2/files/list_folder'
        var revCache = this._revCache
        var self = this

        var processResponse = function(resp) {
            var body, listing

            if (resp.status !== 200 && resp.status !== 409) {
                return Promise.reject(
                    'Unexpected response status: ' + resp.status,
                )
            }

            try {
                body = JSON.parse(resp.responseText)
            } catch (e) {
                return Promise.reject(e)
            }

            if (resp.status === 409) {
                if (compareApiError(body, ['path', 'not_found'])) {
                    // if the folder is not found, handle it as an empty folder
                    return Promise.resolve({})
                }

                return Promise.reject(
                    new Error('API returned an error: ' + body.error_summary),
                )
            }

            listing = body.entries.reduce(function(map, item) {
                var isDir = item['.tag'] === 'folder'
                var itemName =
                    item.path_lower.split('/').slice(-1)[0] + (isDir ? '/' : '')
                if (isDir) {
                    map[itemName] = { ETag: revCache.get(path + itemName) }
                } else {
                    map[itemName] = { ETag: item.rev }
                }
                return map
            }, {})

            if (body.has_more) {
                return loadNext(body.cursor).then(function(nextListing) {
                    return Object.assign(listing, nextListing)
                })
            }

            return Promise.resolve(listing)
        }

        const loadNext = function(cursor) {
            const continueURL =
                'https://api.dropboxapi.com/2/files/list_folder/continue'
            const params = {
                body: { cursor: cursor },
            }

            return self
                ._request('POST', continueURL, params)
                .then(processResponse)
        }

        return this._request('POST', url, {
            body: {
                path: getDropboxPath(path),
            },
        })
            .then(processResponse)
            .then(function(listing) {
                return Promise.resolve({
                    statusCode: 200,
                    body: listing,
                    contentType: 'application/json; charset=UTF-8',
                    revision: revCache.get(path),
                })
            })
    },

    /**
     * Checks for the path in ``_revCache`` and decides based on that if file
     * has changed. Calls ``_getFolder`` is the path points to a folder.
     *
     * Calls ``Dropbox.share`` afterwards to fill ``_itemRefs``.
     *
     * Compatible with ``WireClient.get``
     *
     * @param path {string} - path of the folder to get, with leading slash
     * @param options {Object}
     *
     * @protected
     */
    get: function(path, options) {
        if (!this.connected) {
            return Promise.reject('not connected (path: ' + path + ')')
        }
        var url = 'https://content.dropboxapi.com/2/files/download'
        var self = this

        //use _getFolder for folders
        if (path.substr(-1) === '/') {
            return this._getFolder(path, options)
        }

        var savedRev = this._revCache.get(path)
        if (savedRev === null) {
            // file was deleted server side
            return Promise.resolve({ statusCode: 404 })
        }
        if (
            options &&
            options.ifNoneMatch &&
            savedRev &&
            savedRev === options.ifNoneMatch
        ) {
            // nothing changed.
            return Promise.resolve({ statusCode: 304 })
        }

        var params = {
            headers: {
                'Dropbox-API-Arg': JSON.stringify({
                    path: getDropboxPath(path),
                }),
            },
        }
        if (options && options.ifNoneMatch) {
            params.headers['If-None-Match'] = options.ifNoneMatch
        }

        return this._request('GET', url, params).then(function(resp) {
            var status = resp.status
            var meta, body, mime, rev
            if (status !== 200 && status !== 409) {
                return Promise.resolve({ statusCode: status })
            }
            meta = resp.getResponseHeader('Dropbox-API-Result')
            body = resp.responseText

            if (status === 409) {
                meta = body
            }

            try {
                meta = JSON.parse(meta)
            } catch (e) {
                return Promise.reject(e)
            }

            if (status === 409) {
                if (compareApiError(meta, ['path', 'not_found'])) {
                    return Promise.resolve({ statusCode: 404 })
                }
                return Promise.reject(
                    new Error(
                        'API error while downloading file ("' +
                            path +
                            '"): ' +
                            meta.error_summary,
                    ),
                )
            }

            mime = resp.getResponseHeader('Content-Type')
            rev = meta.rev
            self._revCache.set(path, rev)
            self._shareIfNeeded(path)

            // handling binary
            if (shouldBeTreatedAsBinary(resp.response, mime)) {
                return readBinaryData(resp.response, mime).then(result => {
                    return {
                        statusCode: status,
                        body: result,
                        contentType: mime,
                        revision: rev,
                    }
                })
            }

            // handling json (always try)
            try {
                body = JSON.parse(body)
                mime = 'application/json; charset=UTF-8'
            } catch (e) {
                //Failed parsing Json, assume it is something else then
            }

            return Promise.resolve({
                statusCode: status,
                body: body,
                contentType: mime,
                revision: rev,
            })
        })
    },

    /**
     * Checks for the path in ``_revCache`` and decides based on that if file
     * has changed.
     *
     * Compatible with ``WireClient``
     *
     * Calls ``Dropbox.share`` afterwards to fill ``_itemRefs``.
     *
     * @param {string} path - path of the folder to put, with leading slash
     * @param {Object} options
     * @param {string} options.ifNoneMatch - Only create of update the file if the
     *                                       current ETag doesn't match this string
     * @returns {Promise} Resolves with an object containing the status code,
     *                    content-type and revision
     * @protected
     */
    put: function(path, body, contentType, options) {
        var self = this

        if (!this.connected) {
            throw new Error('not connected (path: ' + path + ')')
        }

        //check if file has changed and return 412
        var savedRev = this._revCache.get(path)
        if (
            options &&
            options.ifMatch &&
            savedRev &&
            savedRev !== options.ifMatch
        ) {
            return Promise.resolve({ statusCode: 412, revision: savedRev })
        }
        if (
            options &&
            options.ifNoneMatch === '*' &&
            savedRev &&
            savedRev !== 'rev'
        ) {
            return Promise.resolve({ statusCode: 412, revision: savedRev })
        }

        if (!contentType.match(/charset=/) && isBinaryData(body)) {
            contentType += '; charset=binary'
        }

        if (body.length > 150 * 1024 * 1024) {
            //https://www.dropbox.com/developers/core/docs#chunked-upload
            return Promise.reject(
                new Error('Cannot upload file larger than 150MB'),
            )
        }

        var result
        var needsMetadata =
            options && (options.ifMatch || options.ifNoneMatch === '*')
        var uploadParams = {
            body: body,
            contentType: contentType,
            path: path,
        }

        if (needsMetadata) {
            result = this._getMetadata(path).then(function(metadata) {
                if (options && options.ifNoneMatch === '*' && metadata) {
                    // if !!metadata === true, the file exists
                    return Promise.resolve({
                        statusCode: 412,
                        revision: metadata.rev,
                    })
                }

                if (
                    options &&
                    options.ifMatch &&
                    metadata &&
                    metadata.rev !== options.ifMatch
                ) {
                    return Promise.resolve({
                        statusCode: 412,
                        revision: metadata.rev,
                    })
                }

                return self._uploadSimple(uploadParams)
            })
        } else {
            result = self._uploadSimple(uploadParams)
        }

        return result.then(function(ret) {
            self._shareIfNeeded(path)
            return ret
        })
    },

    /**
     * Checks for the path in ``_revCache`` and decides based on that if file
     * has changed.
     *
     * Compatible with ``WireClient.delete``
     *
     * Calls ``Dropbox.share`` afterwards to fill ``_itemRefs``.
     *
     * @param {string} path - path of the folder to delete, with leading slash
     * @param {Object} options
     *
     * @protected
     */
    delete: function(path, options) {
        if (!this.connected) {
            throw new Error('not connected (path: ' + path + ')')
        }

        //check if file has changed and return 412
        var savedRev = this._revCache.get(path)
        if (
            options &&
            options.ifMatch &&
            savedRev &&
            options.ifMatch !== savedRev
        ) {
            return Promise.resolve({ statusCode: 412, revision: savedRev })
        }

        if (options && options.ifMatch) {
            return this._getMetadata(path).then(metadata => {
                if (
                    options &&
                    options.ifMatch &&
                    metadata &&
                    metadata.rev !== options.ifMatch
                ) {
                    return Promise.resolve({
                        statusCode: 412,
                        revision: metadata.rev,
                    })
                }

                return this._deleteSimple(path)
            })
        }

        return this._deleteSimple(path)
    },

    /**
     * Calls share, if the provided path resides in a public folder.
     *
     * @private
     */
    _shareIfNeeded: function(path) {
        if (
            path.match(/^\/public\/.*[^/]$/) &&
            this._itemRefs[path] === undefined
        ) {
            this.share(path)
        }
    },

    /**
     * Gets a publicly-accessible URL for the path from Dropbox and stores it
     * in ``_itemRefs``.
     *
     * @return {Promise} a promise for the URL
     *
     * @private
     */
    share: function(path) {
        var url =
            'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings'
        var options = {
            body: { path: getDropboxPath(path) },
        }

        return this._request('POST', url, options)
            .then(response => {
                if (response.status !== 200 && response.status !== 409) {
                    return Promise.reject(
                        new Error('Invalid response status:' + response.status),
                    )
                }

                var body

                try {
                    body = JSON.parse(response.responseText)
                } catch (e) {
                    return Promise.reject(
                        new Error(
                            'Invalid response body: ' + response.responseText,
                        ),
                    )
                }

                if (response.status === 409) {
                    if (compareApiError(body, ['shared_link_already_exists'])) {
                        return this._getSharedLink(path)
                    }

                    return Promise.reject(
                        new Error('API error: ' + body.error_summary),
                    )
                }

                return Promise.resolve(body.url)
            })
            .then(
                link => {
                    this._itemRefs[path] = link

                    if (hasLocalStorage) {
                        localStorage.setItem(
                            SETTINGS_KEY + ':shares',
                            JSON.stringify(this._itemRefs),
                        )
                    }

                    return Promise.resolve(link)
                },
                error => {
                    error.message =
                        'Sharing Dropbox file or folder ("' +
                        path +
                        '") failed: ' +
                        error.message
                    return Promise.reject(error)
                },
            )
    },

    /**
     * Fetches the user's info from dropbox and returns a promise for it.
     *
     * @return {Promise} a promise for user info object (email - the user's email address)
     *
     * @protected
     */
    info: function() {
        var url = 'https://api.dropboxapi.com/2/users/get_current_account'

        return this._request('POST', url, {}).then(function(response) {
            var info = response.responseText

            try {
                info = JSON.parse(info)
            } catch (e) {
                return Promise.reject(
                    new Error(
                        'Could not query current account info: Invalid API response: ' +
                            info,
                    ),
                )
            }

            return Promise.resolve({
                email: info.email,
            })
        })
    },

    /**
     * Make a network request.
     *
     * @param {string} method - Request method
     * @param {string} url - Target URL
     * @param {object} options - Request options
     * @returns {Promise} Resolves with the response of the network request
     *
     * @private
     */
    _request: function(method, url, options) {
        var self = this

        if (!options.headers) {
            options.headers = {}
        }
        options.headers['Authorization'] = 'Bearer ' + this.token

        if (typeof options.body === 'object' && !isBinaryData(options.body)) {
            options.body = JSON.stringify(options.body)
            options.headers['Content-Type'] = 'application/json; charset=UTF-8'
        }

        this.rs._emit('wire-busy', {
            method: method,
            isFolder: isFolder(url),
        })

        return WireClient.request.call(this, method, url, options).then(
            function(xhr) {
                // 503 means retry this later
                if (xhr && xhr.status === 503) {
                    if (self.online) {
                        self.online = false
                        self.rs._emit('network-offline')
                    }
                    return setTimeout(self._request(method, url, options), 3210)
                } else {
                    if (!self.online) {
                        self.online = true
                        self.rs._emit('network-online')
                    }
                    self.rs._emit('wire-done', {
                        method: method,
                        isFolder: isFolder(url),
                        success: true,
                    })

                    return Promise.resolve(xhr)
                }
            },
            function(error) {
                if (self.online) {
                    self.online = false
                    self.rs._emit('network-offline')
                }
                self.rs._emit('wire-done', {
                    method: method,
                    isFolder: isFolder(url),
                    success: false,
                })

                return Promise.reject(error)
            },
        )
    },

    /**
     * Fetches the revision of all the files from dropbox API and puts them
     * into ``_revCache``. These values can then be used to determine if
     * something has changed.
     *
     * @private
     */
    fetchDelta: function() {
        var args = Array.prototype.slice.call(arguments)
        var self = this

        var fetch = function(cursor) {
            let url = 'https://api.dropboxapi.com/2/files/list_folder'
            let requestBody

            if (typeof cursor === 'string') {
                url += '/continue'
                requestBody = { cursor }
            } else {
                requestBody = {
                    path: PATH_PREFIX,
                    recursive: true,
                    include_deleted: true,
                }
            }

            return self
                ._request('POST', url, { body: requestBody })
                .then(function(response) {
                    if (response.status === 401) {
                        self.rs._emit('error', new Authorize.Unauthorized())
                        return Promise.resolve(args)
                    }

                    if (response.status !== 200 && response.status !== 409) {
                        return Promise.reject(
                            new Error(
                                'Invalid response status: ' + response.status,
                            ),
                        )
                    }

                    let responseBody

                    try {
                        responseBody = JSON.parse(response.responseText)
                    } catch (e) {
                        return Promise.reject(
                            new Error(
                                'Invalid response body: ' +
                                    response.responseText,
                            ),
                        )
                    }

                    if (response.status === 409) {
                        if (
                            compareApiError(responseBody, ['path', 'not_found'])
                        ) {
                            responseBody = {
                                cursor: null,
                                entries: [],
                                has_more: false,
                            }
                        } else {
                            return Promise.reject(
                                new Error(
                                    'API returned an error: ' +
                                        responseBody.error_summary,
                                ),
                            )
                        }
                    }

                    responseBody.entries.forEach(function(entry) {
                        var path = entry.path_lower.substr(PATH_PREFIX.length)

                        if (entry['.tag'] === 'deleted') {
                            // there's no way to know whether the entry was a file or a folder
                            self._revCache.set(path, null)
                            self._revCache.set(path + '/', null)
                        } else if (entry['.tag'] === 'file') {
                            self._revCache.set(path, entry.rev)
                        }
                    })

                    if (responseBody.has_more) {
                        return fetch(responseBody.cursor)
                    }
                })
                .catch(error => {
                    if (error === 'timeout' || error instanceof ProgressEvent) {
                        // Offline is handled elsewhere already, just ignore it here
                        return Promise.resolve()
                    } else {
                        return Promise.reject(error)
                    }
                })
        }

        // Dropbox will always send the complete file list
        self._revCache = new LowerCaseCache('rev')

        return fetch()
            .then(undefined, function(error) {
                if (typeof error === 'object' && 'message' in error) {
                    error.message = 'Dropbox: fetchDelta: ' + error.message
                } else {
                    error = `Dropbox: fetchDelta: ${error}`
                }
                return Promise.reject(error)
            })
            .then(function() {
                if (self._revCache) {
                    self._revCache._activatePropagation()
                }
                return Promise.resolve(args)
            })
    },

    /**
     * Gets metadata for a path (can point to either a file or a folder).
     *
     * @param {string} path - the path to get metadata for
     *
     * @returns {Promise} A promise for the metadata
     *
     * @private
     */
    _getMetadata: function(path) {
        const url = 'https://api.dropboxapi.com/2/files/get_metadata'
        const requestBody = {
            path: getDropboxPath(path),
        }

        return this._request('POST', url, { body: requestBody })
            .then(response => {
                if (response.status !== 200 && response.status !== 409) {
                    return Promise.reject(
                        new Error('Invalid response status:' + response.status),
                    )
                }

                let responseBody

                try {
                    responseBody = JSON.parse(response.responseText)
                } catch (e) {
                    return Promise.reject(
                        new Error(
                            'Invalid response body: ' + response.responseText,
                        ),
                    )
                }

                if (response.status === 409) {
                    if (compareApiError(responseBody, ['path', 'not_found'])) {
                        return Promise.resolve()
                    }

                    return Promise.reject(
                        new Error('API error: ' + responseBody.error_summary),
                    )
                }

                return Promise.resolve(responseBody)
            })
            .then(undefined, error => {
                error.message =
                    'Could not load metadata for file or folder ("' +
                    path +
                    '"): ' +
                    error.message
                return Promise.reject(error)
            })
    },

    /**
     * Upload a simple file (the size is no more than 150MB).
     *
     * @param {Object} params
     * @param {string} options.ifMatch - Only update the file if its ETag
     *                                   matches this string
     * @param {string} options.path - path of the file
     * @param {string} options.body - contents of the file to upload
     * @param {string} options.contentType - mime type of the file
     *
     * @return {Promise} A promise for an object with the following structure:
     *         statusCode - HTTP status code
     *         revision - revision of the newly-created file, if any
     *
     * @private
     */
    _uploadSimple: function(params) {
        var url = 'https://content.dropboxapi.com/2/files/upload'
        var args = {
            path: getDropboxPath(params.path),
            mode: { '.tag': 'overwrite' },
            mute: true,
        }

        if (params.ifMatch) {
            args.mode = { '.tag': 'update', update: params.ifMatch }
        }

        return this._request('POST', url, {
            body: params.body,
            headers: {
                'Content-Type': 'application/octet-stream',
                'Dropbox-API-Arg': JSON.stringify(args),
            },
        }).then(response => {
            if (response.status !== 200 && response.status !== 409) {
                return Promise.resolve({ statusCode: response.status })
            }

            var body = response.responseText

            try {
                body = JSON.parse(body)
            } catch (e) {
                return Promise.reject(new Error('Invalid API result: ' + body))
            }

            if (response.status === 409) {
                if (compareApiError(body, ['path', 'conflict'])) {
                    return this._getMetadata(params.path).then(function(
                        metadata,
                    ) {
                        return Promise.resolve({
                            statusCode: 412,
                            revision: metadata.rev,
                        })
                    })
                }
                return Promise.reject(
                    new Error('API error: ' + body.error_summary),
                )
            }

            this._revCache.propagateSet(params.path, body.rev)

            return Promise.resolve({
                statusCode: response.status,
                revision: body.rev,
            })
        })
    },

    /**
     * Deletes a file or a folder.
     *
     * @param {string} path - the path to delete
     *
     * @returns {Promise} A promise for an object with the following structure:
     *          statusCode - HTTP status code
     *
     * @private
     */
    _deleteSimple: function(path) {
        const url = 'https://api.dropboxapi.com/2/files/delete'
        const requestBody = { path: getDropboxPath(path) }

        return this._request('POST', url, { body: requestBody })
            .then(response => {
                if (response.status !== 200 && response.status !== 409) {
                    return Promise.resolve({ statusCode: response.status })
                }

                var responseBody = response.responseText

                try {
                    responseBody = JSON.parse(responseBody)
                } catch (e) {
                    return Promise.reject(
                        new Error('Invalid response body: ' + responseBody),
                    )
                }

                if (response.status === 409) {
                    if (
                        compareApiError(responseBody, [
                            'path_lookup',
                            'not_found',
                        ])
                    ) {
                        return Promise.resolve({ statusCode: 404 })
                    }
                    return Promise.reject(
                        new Error('API error: ' + responseBody.error_summary),
                    )
                }

                return Promise.resolve({ statusCode: 200 })
            })
            .then(
                result => {
                    if (
                        result.statusCode === 200 ||
                        result.statusCode === 404
                    ) {
                        this._revCache.delete(path)
                        delete this._itemRefs[path]
                    }
                    return Promise.resolve(result)
                },
                error => {
                    error.message =
                        'Could not delete Dropbox file or folder ("' +
                        path +
                        '"): ' +
                        error.message
                    return Promise.reject(error)
                },
            )
    },

    /**
     * Requests the link for an already-shared file or folder.
     *
     * @param {string} path - path to the file or folder
     *
     * @returns {Promise} A promise for the shared link
     *
     * @private
     */
    _getSharedLink: function(path) {
        var url = 'https://api.dropbox.com/2/sharing/list_shared_links'
        var options = {
            body: {
                path: getDropboxPath(path),
                direct_only: true,
            },
        }

        return this._request('POST', url, options).then(
            response => {
                if (response.status !== 200 && response.status !== 409) {
                    return Promise.reject(
                        new Error(
                            'Invalid response status: ' + response.status,
                        ),
                    )
                }

                var body

                try {
                    body = JSON.parse(response.responseText)
                } catch (e) {
                    return Promise.reject(
                        new Error(
                            'Invalid response body: ' + response.responseText,
                        ),
                    )
                }

                if (response.status === 409) {
                    return Promise.reject(
                        new Error('API error: ' + response.error_summary),
                    )
                }

                if (!body.links.length) {
                    return Promise.reject(new Error('No links returned'))
                }

                return Promise.resolve(body.links[0].url)
            },
            error => {
                error.message =
                    'Could not get link to a shared file or folder ("' +
                    path +
                    '"): ' +
                    error.message
                return Promise.reject(error)
            },
        )
    },
}

/**
 * Hooking the sync
 *
 * TODO: document
 */
function hookSync(rs) {
    if (rs._dropboxOrigSync) {
        return
    } // already hooked
    rs._dropboxOrigSync = rs.sync.sync.bind(rs.sync)
    rs.sync.sync = function() {
        return this.dropbox.fetchDelta
            .apply(this.dropbox, arguments)
            .then(rs._dropboxOrigSync, function(err) {
                rs._emit('error', new Sync.SyncError(err))
                return Promise.reject(err)
            })
    }.bind(rs)
}

/**
 * Unhooking the sync
 *
 * TODO: document
 */
function unHookSync(rs) {
    if (!rs._dropboxOrigSync) {
        return
    } // not hooked
    rs.sync.sync = rs._dropboxOrigSync
    delete rs._dropboxOrigSync
}

/**
 * Overwrite BaseClient's getItemURL with our own implementation
 *
 * TODO: getItemURL still needs to be implemented
 *
 * @param {object} rs - RemoteStorage instance
 *
 * @private
 */
function hookGetItemURL(rs) {
    if (rs._origBaseClientGetItemURL) {
        return
    }
    rs._origBaseClientGetItemURL = BaseClient.prototype.getItemURL
    BaseClient.prototype.getItemURL = function(/*path*/) {
        throw new Error('getItemURL is not implemented for Dropbox yet')
    }
}

/**
 * Restore BaseClient's getItemURL original implementation
 *
 * @param {object} rs - RemoteStorage instance
 *
 * @private
 */
function unHookGetItemURL(rs) {
    if (!rs._origBaseClientGetItemURL) {
        return
    }
    BaseClient.prototype.getItemURL = rs._origBaseClientGetItemURL
    delete rs._origBaseClientGetItemURL
}

/**
 * TODO: document
 */
function hookRemote(rs) {
    if (rs._origRemote) {
        return
    }
    rs._origRemote = rs.remote
    rs.remote = rs.dropbox
}

/**
 * TODO: document
 */
function unHookRemote(rs) {
    if (rs._origRemote) {
        rs.remote = rs._origRemote
        delete rs._origRemote
    }
}

/**
 * TODO: document
 */
function hookIt(rs) {
    hookRemote(rs)
    if (rs.sync) {
        hookSync(rs)
    } else {
        // when sync is not available yet, we wait for the remote to be connected,
        // at which point sync should be available as well
        rs.on('connected', function() {
            if (rs.sync) {
                hookSync(rs)
            }
        })
    }
    hookGetItemURL(rs)
}

/**
 * TODO: document
 */
function unHookIt(rs) {
    unHookRemote(rs)
    unHookSync(rs)
    unHookGetItemURL(rs)
}

/**
 * Initialize the Dropbox backend.
 *
 * @param {object} remoteStorage - RemoteStorage instance
 *
 * @protected
 */
Dropbox._rs_init = function(rs) {
    hasLocalStorage = util.localStorageAvailable()
    if (rs.apiKeys.dropbox) {
        rs.dropbox = new Dropbox(rs)
    }
    if (rs.backend === 'dropbox') {
        hookIt(rs)
    }
}

/**
 * Inform about the availability of the Dropbox backend.
 *
 * @param {object} rs - RemoteStorage instance
 * @returns {Boolean}
 *
 * @protected
 */
Dropbox._rs_supported = function() {
    return true
}

/**
 * Remove Dropbox as a backend.
 *
 * @param {object} remoteStorage - RemoteStorage instance
 *
 * @protected
 */
Dropbox._rs_cleanup = function(rs) {
    unHookIt(rs)
    if (hasLocalStorage) {
        localStorage.removeItem(SETTINGS_KEY)
    }
    rs.setBackend(undefined)
}

module.exports = Dropbox
