/**
 * @class Access
 *
 * Keeps track of claimed access and scopes.
 */
var Access = function() {
    this.reset()
}

Access.prototype = {
    /**
     * Claim access on a given scope with given mode.
     *
     * @param {string} scope - An access scope, such as "contacts" or "calendar"
     * @param {string} mode - Access mode. Either "r" for read-only or "rw" for read/write
     */
    claim: function(scope, mode) {
        if (
            typeof scope !== 'string' ||
            scope.indexOf('/') !== -1 ||
            scope.length === 0
        ) {
            throw new Error(
                'Scope should be a non-empty string without forward slashes',
            )
        }
        if (!mode.match(/^rw?$/)) {
            throw new Error("Mode should be either 'r' or 'rw'")
        }
        this._adjustRootPaths(scope)
        this.scopeModeMap[scope] = mode
    },

    /**
     * Get the access mode for a given scope.
     *
     * @param {string} scope - Access scope
     * @returns {string} Access mode
     */
    get: function(scope) {
        return this.scopeModeMap[scope]
    },

    /**
     * Remove access for the given scope.
     *
     * @param {string} scope - Access scope
     */
    remove: function(scope) {
        var savedMap = {}
        var name
        for (name in this.scopeModeMap) {
            savedMap[name] = this.scopeModeMap[name]
        }
        this.reset()
        delete savedMap[scope]
        for (name in savedMap) {
            this.set(name, savedMap[name])
        }
    },

    /**
     * Verify permission for a given scope.
     *
     * @param {string} scope - Access scope
     * @param {string} mode - Access mode
     * @returns {boolean} true if the requested access mode is active, false otherwise
     */
    checkPermission: function(scope, mode) {
        var actualMode = this.get(scope)
        return actualMode && (mode === 'r' || actualMode === 'rw')
    },

    /**
     * Verify permission for a given path.
     *
     * @param {string} path - Path
     * @param {string} mode - Access mode
     * @returns {boolean} true if the requested access mode is active, false otherwise
     */
    checkPathPermission: function(path, mode) {
        if (this.checkPermission('*', mode)) {
            return true
        }
        return !!this.checkPermission(this._getModuleName(path), mode)
    },

    /**
     * Reset all access permissions.
     */
    reset: function() {
        this.rootPaths = []
        this.scopeModeMap = {}
    },

    /**
     * Return the module name for a given path.
     *
     * @private
     */
    _getModuleName: function(path) {
        if (path[0] !== '/') {
            throw new Error('Path should start with a slash')
        }
        var moduleMatch = path.replace(/^\/public/, '').match(/^\/([^/]*)\//)
        return moduleMatch ? moduleMatch[1] : '*'
    },

    /**
     * TODO: document
     *
     * @param {string} newScope
     *
     * @private
     */
    _adjustRootPaths: function(newScope) {
        if ('*' in this.scopeModeMap || newScope === '*') {
            this.rootPaths = ['/']
        } else if (!(newScope in this.scopeModeMap)) {
            this.rootPaths.push('/' + newScope + '/')
            this.rootPaths.push('/public/' + newScope + '/')
        }
    },

    /**
     * TODO: document
     *
     * @param {string} scope
     * @returns {string}
     *
     * @private
     */
    _scopeNameForParameter: function(scope) {
        if (scope.name === '*' && this.storageType) {
            if (this.storageType === '2012.04') {
                return ''
            } else if (this.storageType.match(/remotestorage-0[01]/)) {
                return 'root'
            }
        }
        return scope.name
    },

    /**
     * Set the storage type of the remote.
     *
     * @param {string} type - Storage type
     */
    setStorageType: function(type) {
        this.storageType = type
    },
}

/**
 * Property: scopes
 *
 * Holds an array of claimed scopes in the form
 * > { name: "<scope-name>", mode: "<mode>" }
 */
Object.defineProperty(Access.prototype, 'scopes', {
    get: function() {
        return Object.keys(this.scopeModeMap).map(
            function(key) {
                return { name: key, mode: this.scopeModeMap[key] }
            }.bind(this),
        )
    },
})

Object.defineProperty(Access.prototype, 'scopeParameter', {
    get: function() {
        return this.scopes
            .map(
                function(scope) {
                    return this._scopeNameForParameter(scope) + ':' + scope.mode
                }.bind(this),
            )
            .join(' ')
    },
})

Access._rs_init = function() {}

module.exports = Access
