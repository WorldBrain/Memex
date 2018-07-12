const eventHandling = require('./eventhandling')
const util = require('./util')
const config = require('./config')
const tv4 = require('tv4')
const Types = require('./types')

const SchemaNotFound = Types.SchemaNotFound

/**
 * Provides a high-level interface to access data below a given root path.
 */
var BaseClient = function(storage, base) {
    if (base[base.length - 1] !== '/') {
        throw 'Not a folder: ' + base
    }

    if (base === '/') {
        // allow absolute and relative paths for the root scope.
        this.makePath = function(path) {
            return (path[0] === '/' ? '' : '/') + path
        }
    }

    /**
     * The <RemoteStorage> instance this <BaseClient> operates on.
     */
    this.storage = storage

    /**
     * Base path, which this <BaseClient> operates on.
     *
     * For the module's privateClient this would be /<moduleName>/, for the
     * corresponding publicClient /public/<moduleName>/.
     */
    this.base = base

    /**
     * TODO: document what this does exactly
     */
    var parts = this.base.split('/')
    if (parts.length > 2) {
        this.moduleName = parts[1]
    } else {
        this.moduleName = 'root'
    }

    eventHandling(this, 'change')
    this.on = this.on.bind(this)
    storage.onChange(this.base, this._fireChange.bind(this))
}

BaseClient.Types = Types

BaseClient.prototype = {
    /**
     * Instantiate a new client, scoped to a subpath of the current client's
     * path.
     *
     * @param {string} path - The path to scope the new client to.
     *
     * @returns {BaseClient} A new client operating on a subpath of the current
     *                       base path.
     */
    scope: function(path) {
        return new BaseClient(this.storage, this.makePath(path))
    },

    /**
     * Get a list of child nodes below a given path.
     *
     * @param {string} path - The path to query. It MUST end with a forward slash.
     * @param {number} maxAge - (optional) Either ``false`` or the maximum age of
     *                          cached listing in milliseconds. See :ref:`max-age`.
     *
     * @returns {Promise} A promise for an object representing child nodes
     */
    getListing: function(path, maxAge) {
        if (typeof path !== 'string') {
            path = ''
        } else if (path.length > 0 && path[path.length - 1] !== '/') {
            return Promise.reject('Not a folder: ' + path)
        }
        return this.storage.get(this.makePath(path), maxAge).then(function(r) {
            return r.statusCode === 404 ? {} : r.body
        })
    },

    /**
     * Get all objects directly below a given path.
     *
     * @param {string} path - Path to the folder. Must end in a forward slash.
     * @param {number} maxAge - (optional) Either ``false`` or the maximum age of
     *                          cached objects in milliseconds. See :ref:`max-age`.
     *
     * @returns {Promise} A promise for an object
     */
    getAll: function(path, maxAge) {
        if (typeof path !== 'string') {
            path = ''
        } else if (path.length > 0 && path[path.length - 1] !== '/') {
            return Promise.reject('Not a folder: ' + path)
        }

        return this.storage.get(this.makePath(path), maxAge).then(
            function(r) {
                if (r.statusCode === 404) {
                    return {}
                }
                if (typeof r.body === 'object') {
                    var keys = Object.keys(r.body)
                    if (keys.length === 0) {
                        // treat this like 404. it probably means a folder listing that
                        // has changes that haven't been pushed out yet.
                        return {}
                    }

                    var calls = keys.map(
                        function(key) {
                            return this.storage
                                .get(this.makePath(path + key), maxAge)
                                .then(function(o) {
                                    if (typeof o.body === 'string') {
                                        try {
                                            o.body = JSON.parse(o.body)
                                        } catch (e) {
                                            // empty
                                        }
                                    }
                                    if (typeof o.body === 'object') {
                                        r.body[key] = o.body
                                    }
                                })
                        }.bind(this),
                    )
                    return Promise.all(calls).then(function() {
                        return r.body
                    })
                }
            }.bind(this),
        )
    },

    /**
     * Get the file at the given path. A file is raw data, as opposed to
     * a JSON object (use :func:`getObject` for that).
     *
     * @param {string} path - Relative path from the module root (without leading
     *                        slash).
     * @param {number} maxAge - (optional) Either ``false`` or the maximum age of
     *                          the cached file in milliseconds. See :ref:`max-age`.
     *
     * @returns {Promise} A promise for an object
     */
    getFile: function(path, maxAge) {
        if (typeof path !== 'string') {
            return Promise.reject(
                "Argument 'path' of baseClient.getFile must be a string",
            )
        }
        return this.storage.get(this.makePath(path), maxAge).then(function(r) {
            return {
                data: r.body,
                contentType: r.contentType,
                revision: r.revision, // (this is new)
            }
        })
    },

    /**
     * Store raw data at a given path.
     *
     * @param {string} mimeType - MIME media type of the data being stored
     * @param {string} path     - Path relative to the module root
     * @param {string|ArrayBuffer|ArrayBufferView} body - Raw data to store
     *
     * @returns {Promise} A promise for the created/updated revision (ETag)
     */
    storeFile: function(mimeType, path, body) {
        if (typeof mimeType !== 'string') {
            return Promise.reject(
                "Argument 'mimeType' of baseClient.storeFile must be a string",
            )
        }
        if (typeof path !== 'string') {
            return Promise.reject(
                "Argument 'path' of baseClient.storeFile must be a string",
            )
        }
        if (typeof body !== 'string' && typeof body !== 'object') {
            return Promise.reject(
                "Argument 'body' of baseClient.storeFile must be a string, ArrayBuffer, or ArrayBufferView",
            )
        }
        if (
            !this.storage.access.checkPathPermission(this.makePath(path), 'rw')
        ) {
            console.warn(
                "WARNING: Editing a document to which only read access ('r') was claimed",
            )
        }

        return this.storage.put(this.makePath(path), body, mimeType).then(
            function(r) {
                if (r.statusCode === 200 || r.statusCode === 201) {
                    return r.revision
                } else {
                    return Promise.reject(
                        'Request (PUT ' +
                            this.makePath(path) +
                            ') failed with status: ' +
                            r.statusCode,
                    )
                }
            }.bind(this),
        )
    },

    /**
     * Get a JSON object from the given path.
     *
     * @param {string} path - Relative path from the module root (without leading
     *                        slash).
     * @param {number} maxAge - (optional) Either ``false`` or the maximum age of
     *                          cached object in milliseconds. See :ref:`max-age`.
     *
     * @returns {Promise} A promise, which resolves with the requested object (or ``null``
     *          if non-existent)
     */
    getObject: function(path, maxAge) {
        if (typeof path !== 'string') {
            return Promise.reject(
                "Argument 'path' of baseClient.getObject must be a string",
            )
        }
        return this.storage.get(this.makePath(path), maxAge).then(
            function(r) {
                if (typeof r.body === 'object') {
                    // will be the case for documents stored with rs.js <= 0.10.0-beta2
                    return r.body
                } else if (typeof r.body === 'string') {
                    try {
                        return JSON.parse(r.body)
                    } catch (e) {
                        throw 'Not valid JSON: ' + this.makePath(path)
                    }
                } else if (
                    typeof r.body !== 'undefined' &&
                    r.statusCode === 200
                ) {
                    return Promise.reject(
                        'Not an object: ' + this.makePath(path),
                    )
                }
            }.bind(this),
        )
    },

    /**
     * Store object at given path. Triggers synchronization.
     *
     * See ``declareType()`` and :doc:`data types </data-modules/defining-data-types>`
     * for an explanation of types
     *
     * @param {string} type   - Unique type of this object within this module.
     * @param {string} path   - Path relative to the module root.
     * @param {object} object - A JavaScript object to be stored at the given
     *                          path. Must be serializable as JSON.
     *
     * @returns {Promise} Resolves with revision on success. Rejects with
     *                    a ValidationError, if validations fail.
     */
    storeObject: function(typeAlias, path, object) {
        if (typeof typeAlias !== 'string') {
            return Promise.reject(
                "Argument 'typeAlias' of baseClient.storeObject must be a string",
            )
        }
        if (typeof path !== 'string') {
            return Promise.reject(
                "Argument 'path' of baseClient.storeObject must be a string",
            )
        }
        if (typeof object !== 'object') {
            return Promise.reject(
                "Argument 'object' of baseClient.storeObject must be an object",
            )
        }

        this._attachType(object, typeAlias)

        try {
            var validationResult = this.validate(object)
            if (!validationResult.valid) {
                return Promise.reject(validationResult)
            }
        } catch (exc) {
            return Promise.reject(exc)
        }

        return this.storage
            .put(
                this.makePath(path),
                JSON.stringify(object),
                'application/json; charset=UTF-8',
            )
            .then(
                function(r) {
                    if (r.statusCode === 200 || r.statusCode === 201) {
                        return r.revision
                    } else {
                        return Promise.reject(
                            'Request (PUT ' +
                                this.makePath(path) +
                                ') failed with status: ' +
                                r.statusCode,
                        )
                    }
                }.bind(this),
            )
    },

    /**
     * Remove node at given path from storage. Triggers synchronization.
     *
     * @param {string} path - Path relative to the module root.
     * @returns {Promise}
     */
    remove: function(path) {
        if (typeof path !== 'string') {
            return Promise.reject(
                "Argument 'path' of baseClient.remove must be a string",
            )
        }
        if (
            !this.storage.access.checkPathPermission(this.makePath(path), 'rw')
        ) {
            console.warn(
                "WARNING: Removing a document to which only read access ('r') was claimed",
            )
        }

        return this.storage.delete(this.makePath(path))
    },

    /**
     * Retrieve full URL of a document. Useful for example for sharing the public
     * URL of an item in the ``/public`` folder.
     *
     * @param {string} path - Path relative to the module root.
     * @returns {string} The full URL of the item, including the storage origin
     */
    getItemURL: function(path) {
        if (typeof path !== 'string') {
            throw "Argument 'path' of baseClient.getItemURL must be a string"
        }
        if (this.storage.connected) {
            path = this._cleanPath(this.makePath(path))
            return this.storage.remote.href + path
        } else {
            return undefined
        }
    },

    /**
     * Set caching strategy for a given path and its children.
     *
     * See :ref:`caching-strategies` for a detailed description of the available
     * strategies.
     *
     * @param {string} path - Path to cache
     * @param {string} strategy - Caching strategy. One of 'ALL', 'SEEN', or
     *                            'FLUSH'. Defaults to 'ALL'.
     *
     * @returns {BaseClient} The same instance this is called on to allow for method chaining
     */
    cache: function(path, strategy) {
        if (typeof path !== 'string') {
            throw "Argument 'path' of baseClient.cache must be a string"
        }

        if (strategy === undefined) {
            strategy = 'ALL'
        } else if (typeof strategy !== 'string') {
            throw "Argument 'strategy' of baseClient.cache must be a string or undefined"
        }
        if (strategy !== 'FLUSH' && strategy !== 'SEEN' && strategy !== 'ALL') {
            throw "Argument 'strategy' of baseclient.cache must be one of " +
                '["FLUSH", "SEEN", "ALL"]'
        }
        this.storage.caching.set(this.makePath(path), strategy)

        return this
    },

    /**
     * TODO: document
     *
     * @param {string} path
     */
    flush: function(path) {
        return this.storage.local.flush(path)
    },

    /**
     * Declare a remoteStorage object type using a JSON schema.
     *
     * See :doc:`Defining data types </data-modules/defining-data-types>` for more info.
     *
     * @param {string} alias  - A type alias/shortname
     * @param {uri}    uri    - (optional) JSON-LD URI of the schema. Automatically generated if none given
     * @param {object} schema - A JSON Schema object describing the object type
     **/
    declareType: function(alias, uri, schema) {
        if (!schema) {
            schema = uri
            uri = this._defaultTypeURI(alias)
        }
        BaseClient.Types.declare(this.moduleName, alias, uri, schema)
    },

    /**
     * Validate an object against the associated schema.
     *
     * @param {Object} object - JS object to validate. Must have a ``@context`` property.
     *
     * @returns {Object} An object containing information about validation errors
     **/
    validate: function(object) {
        var schema = BaseClient.Types.getSchema(object['@context'])
        if (schema) {
            return tv4.validateResult(object, schema)
        } else {
            throw new SchemaNotFound(object['@context'])
        }
    },

    /**
     * TODO document
     *
     * @private
     */
    schemas: {
        configurable: true,
        get: function() {
            return BaseClient.Types.inScope(this.moduleName)
        },
    },

    /**
     * The default JSON-LD @context URL for RS types/objects/documents
     *
     * @private
     */
    _defaultTypeURI: function(alias) {
        return (
            'http://remotestorage.io/spec/modules/' +
            encodeURIComponent(this.moduleName) +
            '/' +
            encodeURIComponent(alias)
        )
    },

    /**
     * Attaches the JSON-LD @content to an object
     *
     * @private
     */
    _attachType: function(object, alias) {
        object['@context'] =
            BaseClient.Types.resolveAlias(this.moduleName + '/' + alias) ||
            this._defaultTypeURI(alias)
    },

    /**
     * TODO: document
     *
     * @private
     */
    makePath: function(path) {
        return this.base + (path || '')
    },

    /**
     * TODO: document
     *
     * @private
     */
    _fireChange: function(event) {
        if (config.changeEvents[event.origin]) {
            ;['new', 'old', 'lastCommon'].forEach(function(fieldNamePrefix) {
                if (
                    !event[fieldNamePrefix + 'ContentType'] ||
                    /^application\/(.*)json(.*)/.exec(
                        event[fieldNamePrefix + 'ContentType'],
                    )
                ) {
                    if (typeof event[fieldNamePrefix + 'Value'] === 'string') {
                        try {
                            event[fieldNamePrefix + 'Value'] = JSON.parse(
                                event[fieldNamePrefix + 'Value'],
                            )
                        } catch (e) {
                            // empty
                        }
                    }
                }
            })
            this._emit('change', event)
        }
    },

    /**
     * TODO: document
     *
     * @private
     */
    _cleanPath: util.cleanPath,
}

BaseClient._rs_init = function() {}

module.exports = BaseClient
