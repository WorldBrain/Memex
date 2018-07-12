'use strict'

const log = require('./log')
const util = require('./util')
const eventHandling = require('./eventhandling')
const Authorize = require('./authorize')
const config = require('./config')

/**
 * This file exposes a get/put/delete interface on top of XMLHttpRequest.
 * It requires to be configured with parameters about the remotestorage server to
 * connect to.
 * Each instance of WireClient is always associated with a single remotestorage
 * server and access token.
 *
 * Usually the WireClient instance can be accessed via `remoteStorage.remote`.
 *
 * This is the get/put/delete interface:
 *
 *   - #get() takes a path and optionally a ifNoneMatch option carrying a version
 *     string to check. It returns a promise that will be fulfilled with the HTTP
 *     response status, the response body, the MIME type as returned in the
 *     'Content-Type' header and the current revision, as returned in the 'ETag'
 *     header.
 *   - #put() takes a path, the request body and a content type string. It also
 *     accepts the ifMatch and ifNoneMatch options, that map to the If-Match and
 *     If-None-Match headers respectively. See the remotestorage-01 specification
 *     for details on handling these headers. It returns a promise, fulfilled with
 *     the same values as the one for #get().
 *   - #delete() takes a path and the ifMatch option as well. It returns a promise
 *     fulfilled with the same values as the one for #get().
 *
 * In addition to this, the WireClient has some compatibility features to work with
 * remotestorage 2012.04 compatible storages. For example it will cache revisions
 * from folder listings in-memory and return them accordingly as the "revision"
 * parameter in response to #get() requests. Similarly it will return 404 when it
 * receives an empty folder listing, to mimic remotestorage-01 behavior. Note
 * that it is not always possible to know the revision beforehand, hence it may
 * be undefined at times (especially for caching-roots).
 *
 * @interface
 */

var hasLocalStorage
var SETTINGS_KEY = 'remotestorage:wireclient'

var API_2012 = 1,
    API_00 = 2,
    API_01 = 3,
    API_02 = 4,
    API_HEAD = 5

var STORAGE_APIS = {
    'draft-dejong-remotestorage-00': API_00,
    'draft-dejong-remotestorage-01': API_01,
    'draft-dejong-remotestorage-02': API_02,
    'https://www.w3.org/community/rww/wiki/read-write-web-00#simple': API_2012,
}

var isArrayBufferView

if (typeof ArrayBufferView === 'function') {
    isArrayBufferView = function(object) {
        return object && object instanceof ArrayBufferView
    }
} else {
    var arrayBufferViews = [
        Int8Array,
        Uint8Array,
        Int16Array,
        Uint16Array,
        Int32Array,
        Uint32Array,
        Float32Array,
        Float64Array,
    ]
    isArrayBufferView = function(object) {
        for (let i = 0; i < 8; i++) {
            if (object instanceof arrayBufferViews[i]) {
                return true
            }
        }
        return false
    }
}

const isFolder = util.isFolder
const cleanPath = util.cleanPath
const shouldBeTreatedAsBinary = util.shouldBeTreatedAsBinary

function addQuotes(str) {
    if (typeof str !== 'string') {
        return str
    }
    if (str === '*') {
        return '*'
    }

    return '"' + str + '"'
}

function stripQuotes(str) {
    if (typeof str !== 'string') {
        return str
    }

    return str.replace(/^["']|["']$/g, '')
}

function getTextFromArrayBuffer(arrayBuffer, encoding) {
    return new Promise((resolve /*, reject*/) => {
        if (typeof Blob === 'undefined') {
            var buffer = new Buffer(new Uint8Array(arrayBuffer))
            resolve(buffer.toString(encoding))
        } else {
            var blob
            util.globalContext.BlobBuilder =
                util.globalContext.BlobBuilder ||
                util.globalContext.WebKitBlobBuilder
            if (typeof util.globalContext.BlobBuilder !== 'undefined') {
                var bb = new global.BlobBuilder()
                bb.append(arrayBuffer)
                blob = bb.getBlob()
            } else {
                blob = new Blob([arrayBuffer])
            }

            var fileReader = new FileReader()
            if (typeof fileReader.addEventListener === 'function') {
                fileReader.addEventListener('loadend', function(evt) {
                    resolve(evt.target.result)
                })
            } else {
                fileReader.onloadend = function(evt) {
                    resolve(evt.target.result)
                }
            }
            fileReader.readAsText(blob, encoding)
        }
    })
}

function determineCharset(mimeType) {
    var charset = 'UTF-8'
    var charsetMatch

    if (mimeType) {
        charsetMatch = mimeType.match(/charset=(.+)$/)
        if (charsetMatch) {
            charset = charsetMatch[1]
        }
    }
    return charset
}

function isFolderDescription(body) {
    return (
        body['@context'] ===
            'http://remotestorage.io/spec/folder-description' &&
        typeof body['items'] === 'object'
    )
}

function isSuccessStatus(status) {
    return [201, 204, 304].indexOf(status) >= 0
}

function isErrorStatus(status) {
    return [401, 403, 404, 412].indexOf(status) >= 0
}

/**
 * Class : WireClient
 **/
var WireClient = function WireClient(rs) {
    this.rs = rs
    this.connected = false

    /**
     * Event: connected
     *   Fired when the wireclient connect method realizes that it is in
     *   possession of a token and href
     **/
    eventHandling(this, 'connected', 'not-connected')

    if (hasLocalStorage) {
        var settings
        try {
            settings = JSON.parse(localStorage[SETTINGS_KEY])
        } catch (e) {
            // no settings stored
        }
        if (settings) {
            setTimeout(
                function() {
                    this.configure(settings)
                }.bind(this),
                0,
            )
        }
    }

    this._revisionCache = {}

    if (this.connected) {
        setTimeout(this._emit.bind(this), 0, 'connected')
    }
}

WireClient.prototype = {
    /**
     * Property: token
     *
     * Holds the bearer token of this WireClient, as obtained in the OAuth dance
     *
     * Example:
     *   (start code)
     *
     *   remoteStorage.remote.token
     *   // -> 'DEADBEEF01=='
     */

    /**
     * Property: href
     *
     * Holds the server's base URL, as obtained in the Webfinger discovery
     *
     * Example:
     *   (start code)
     *
     *   remoteStorage.remote.href
     *   // -> 'https://storage.example.com/users/jblogg/'
     */

    /**
     * Property: storageApi
     *
     * Holds the spec version the server claims to be compatible with
     *
     * Example:
     *   (start code)
     *
     *   remoteStorage.remote.storageApi
     *   // -> 'draft-dejong-remotestorage-01'
     */

    _request: function(
        method,
        uri,
        token,
        headers,
        body,
        getEtag,
        fakeRevision,
    ) {
        if (
            (method === 'PUT' || method === 'DELETE') &&
            uri[uri.length - 1] === '/'
        ) {
            return Promise.reject("Don't " + method + ' on directories!')
        }

        var revision
        var self = this

        if (token !== Authorize.IMPLIED_FAKE_TOKEN) {
            headers['Authorization'] = 'Bearer ' + token
        }

        this.rs._emit('wire-busy', {
            method: method,
            isFolder: isFolder(uri),
        })

        return WireClient.request(method, uri, {
            body: body,
            headers: headers,
            responseType: 'arraybuffer',
        }).then(
            function(response) {
                if (!self.online) {
                    self.online = true
                    self.rs._emit('network-online')
                }
                self.rs._emit('wire-done', {
                    method: method,
                    isFolder: isFolder(uri),
                    success: true,
                })

                if (isErrorStatus(response.status)) {
                    log('[WireClient] Error response status', response.status)
                    if (getEtag) {
                        revision = stripQuotes(
                            response.getResponseHeader('ETag'),
                        )
                    } else {
                        revision = undefined
                    }

                    if (response.status === 401) {
                        self.rs._emit('error', new Authorize.Unauthorized())
                    }

                    return Promise.resolve({
                        statusCode: response.status,
                        revision: revision,
                    })
                } else if (
                    isSuccessStatus(response.status) ||
                    (response.status === 200 && method !== 'GET')
                ) {
                    revision = stripQuotes(response.getResponseHeader('ETag'))
                    log('[WireClient] Successful request', revision)
                    return Promise.resolve({
                        statusCode: response.status,
                        revision: revision,
                    })
                } else {
                    var mimeType = response.getResponseHeader('Content-Type')
                    if (getEtag) {
                        revision = stripQuotes(
                            response.getResponseHeader('ETag'),
                        )
                    } else {
                        revision =
                            response.status === 200 ? fakeRevision : undefined
                    }

                    var charset = determineCharset(mimeType)

                    if (shouldBeTreatedAsBinary(response.response, mimeType)) {
                        log(
                            '[WireClient] Successful request with unknown or binary mime-type',
                            revision,
                        )
                        return Promise.resolve({
                            statusCode: response.status,
                            body: response.response,
                            contentType: mimeType,
                            revision: revision,
                        })
                    } else {
                        return getTextFromArrayBuffer(
                            response.response,
                            charset,
                        ).then(function(textContent) {
                            log('[WireClient] Successful request', revision)
                            return Promise.resolve({
                                statusCode: response.status,
                                body: textContent,
                                contentType: mimeType,
                                revision: revision,
                            })
                        })
                    }
                }
            },
            function(error) {
                if (self.online) {
                    self.online = false
                    self.rs._emit('network-offline')
                }
                self.rs._emit('wire-done', {
                    method: method,
                    isFolder: isFolder(uri),
                    success: false,
                })

                return Promise.reject(error)
            },
        )
    },

    /**
     *
     * Method: configure
     *
     * Sets the userAddress, href, storageApi, token, and properties of a
     * remote store. Also sets connected and online to true and emits the
     * 'connected' event, if both token and href are present.
     *
     * Parameters:
     *   settings - An object that may contain userAddress (string or null),
     *              href (string or null), storageApi (string or null), token (string
     *              or null), and/or properties (the JSON-parsed properties object
     *              from the user's WebFinger record, see section 10 of
     *              http://tools.ietf.org/html/draft-dejong-remotestorage-03
     *              or null).
     *              Fields that are not included (i.e. `undefined`), stay at
     *              their current value. To set a field, include that field
     *              with a `string` value. To reset a field, for instance when
     *              the user disconnected their storage, or you found that the
     *              token you have has expired, simply set that field to `null`.
     */
    configure: function(settings) {
        if (typeof settings !== 'object') {
            throw new Error(
                'WireClient configure settings parameter should be an object',
            )
        }
        if (typeof settings.userAddress !== 'undefined') {
            this.userAddress = settings.userAddress
        }
        if (typeof settings.href !== 'undefined') {
            this.href = settings.href
        }
        if (typeof settings.storageApi !== 'undefined') {
            this.storageApi = settings.storageApi
        }
        if (typeof settings.token !== 'undefined') {
            this.token = settings.token
        }
        if (typeof settings.properties !== 'undefined') {
            this.properties = settings.properties
        }

        if (typeof this.storageApi !== 'undefined') {
            this._storageApi = STORAGE_APIS[this.storageApi] || API_HEAD
            this.supportsRevs = this._storageApi >= API_00
        }
        if (this.href && this.token) {
            this.connected = true
            this.online = true
            this._emit('connected')
        } else {
            this.connected = false
        }
        if (hasLocalStorage) {
            localStorage[SETTINGS_KEY] = JSON.stringify({
                userAddress: this.userAddress,
                href: this.href,
                storageApi: this.storageApi,
                token: this.token,
                properties: this.properties,
            })
        }
    },

    stopWaitingForToken: function() {
        if (!this.connected) {
            this._emit('not-connected')
        }
    },

    get: function(path, options) {
        var self = this
        if (!this.connected) {
            return Promise.reject('not connected (path: ' + path + ')')
        }
        if (!options) {
            options = {}
        }
        var headers = {}
        if (this.supportsRevs) {
            if (options.ifNoneMatch) {
                headers['If-None-Match'] = addQuotes(options.ifNoneMatch)
            }
        }
        // commenting it out as this is doing nothing and jshint is complaining -les
        // else if (options.ifNoneMatch) {
        //   var oldRev = this._revisionCache[path];
        // }

        return this._request(
            'GET',
            this.href + cleanPath(path),
            this.token,
            headers,
            undefined,
            this.supportsRevs,
            this._revisionCache[path],
        ).then(function(r) {
            if (!isFolder(path)) {
                return Promise.resolve(r)
            }
            var itemsMap = {}
            if (typeof r.body !== 'undefined') {
                try {
                    r.body = JSON.parse(r.body)
                } catch (e) {
                    return Promise.reject(
                        'Folder description at ' +
                            self.href +
                            cleanPath(path) +
                            ' is not JSON',
                    )
                }
            }

            if (r.statusCode === 200 && typeof r.body === 'object') {
                // New folder listing received
                if (Object.keys(r.body).length === 0) {
                    // Empty folder listing of any spec
                    r.statusCode = 404
                } else if (isFolderDescription(r.body)) {
                    // >= 02 spec
                    for (var item in r.body.items) {
                        self._revisionCache[path + item] =
                            r.body.items[item].ETag
                    }
                    itemsMap = r.body.items
                } else {
                    // < 02 spec
                    Object.keys(r.body).forEach(function(key) {
                        self._revisionCache[path + key] = r.body[key]
                        itemsMap[key] = { ETag: r.body[key] }
                    })
                }
                r.body = itemsMap
                return Promise.resolve(r)
            } else {
                return Promise.resolve(r)
            }
        })
    },

    put: function(path, body, contentType, options) {
        if (!this.connected) {
            return Promise.reject('not connected (path: ' + path + ')')
        }
        if (!options) {
            options = {}
        }
        if (
            !contentType.match(/charset=/) &&
            (body instanceof ArrayBuffer || isArrayBufferView(body))
        ) {
            contentType += '; charset=binary'
        }
        var headers = { 'Content-Type': contentType }
        if (this.supportsRevs) {
            if (options.ifMatch) {
                headers['If-Match'] = addQuotes(options.ifMatch)
            }
            if (options.ifNoneMatch) {
                headers['If-None-Match'] = addQuotes(options.ifNoneMatch)
            }
        }
        return this._request(
            'PUT',
            this.href + cleanPath(path),
            this.token,
            headers,
            body,
            this.supportsRevs,
        )
    },

    delete: function(path, options) {
        if (!this.connected) {
            throw new Error('not connected (path: ' + path + ')')
        }
        if (!options) {
            options = {}
        }
        var headers = {}
        if (this.supportsRevs) {
            if (options.ifMatch) {
                headers['If-Match'] = addQuotes(options.ifMatch)
            }
        }
        return this._request(
            'DELETE',
            this.href + cleanPath(path),
            this.token,
            headers,
            undefined,
            this.supportsRevs,
        )
    },
}

// Shared isArrayBufferView used by WireClient and Dropbox
WireClient.isArrayBufferView = isArrayBufferView

// Shared request function used by WireClient, GoogleDrive and Dropbox.
// TODO: Should we use fetch ?
WireClient.request = function(method, url, options) {
    return new Promise((resolve, reject) => {
        log('[WireClient]', method, url)

        var timedOut = false

        var timer = setTimeout(function() {
            timedOut = true
            reject('timeout')
        }, config.requestTimeout)

        var xhr = new XMLHttpRequest()
        xhr.open(method, url, true)

        if (options.responseType) {
            xhr.responseType = options.responseType
        }

        if (options.headers) {
            for (var key in options.headers) {
                xhr.setRequestHeader(key, options.headers[key])
            }
        }

        xhr.onload = () => {
            if (timedOut) {
                return
            }
            clearTimeout(timer)
            resolve(xhr)
        }

        xhr.onerror = error => {
            if (timedOut) {
                return
            }
            clearTimeout(timer)
            reject(error)
        }

        var body = options.body

        if (
            typeof body === 'object' &&
            !isArrayBufferView(body) &&
            body instanceof ArrayBuffer
        ) {
            body = new Uint8Array(body)
        }
        xhr.send(body)
    })
}

Object.defineProperty(WireClient.prototype, 'storageType', {
    get: function() {
        if (this.storageApi) {
            var spec = this.storageApi.match(
                /draft-dejong-(remotestorage-\d\d)/,
            )
            return spec ? spec[1] : '2012.04'
        }
    },
})

WireClient._rs_init = function(remoteStorage) {
    hasLocalStorage = util.localStorageAvailable()
    remoteStorage.remote = new WireClient(remoteStorage)
    this.online = true
}

WireClient._rs_supported = function() {
    return !!XMLHttpRequest
}

WireClient._rs_cleanup = function() {
    if (hasLocalStorage) {
        delete localStorage[SETTINGS_KEY]
    }
}

module.exports = WireClient
