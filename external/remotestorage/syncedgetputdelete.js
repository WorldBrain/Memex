const log = require('./log')

function shareFirst(path) {
    return this.backend === 'dropbox' && path.match(/^\/public\/.*[^\/]$/)
}

function maxAgeInvalid(maxAge) {
    return maxAge !== false && typeof maxAge !== 'number'
}

var SyncedGetPutDelete = {
    get: function(path, maxAge) {
        if (this.local) {
            if (maxAge === undefined) {
                if (
                    typeof this.remote === 'object' &&
                    this.remote.connected &&
                    this.remote.online
                ) {
                    maxAge = 2 * this.getSyncInterval()
                } else {
                    log(
                        'Not setting default maxAge, because remote is offline or not connected',
                    )
                    maxAge = false
                }
            }

            if (maxAgeInvalid(maxAge)) {
                return Promise.reject(
                    "Argument 'maxAge' must be false or a number",
                )
            }
            return this.local.get(
                path,
                maxAge,
                this.sync.queueGetRequest.bind(this.sync),
            )
        } else {
            return this.remote.get(path)
        }
    },

    put: function(path, body, contentType) {
        if (shareFirst.bind(this)(path)) {
            return SyncedGetPutDelete._wrapBusyDone.call(
                this,
                this.remote.put(path, body, contentType),
            )
        } else if (this.local) {
            return this.local.put(path, body, contentType)
        } else {
            return SyncedGetPutDelete._wrapBusyDone.call(
                this,
                this.remote.put(path, body, contentType),
            )
        }
    },

    delete: function(path) {
        if (this.local) {
            return this.local.delete(path)
        } else {
            return SyncedGetPutDelete._wrapBusyDone.call(
                this,
                this.remote.delete(path),
            )
        }
    },

    _wrapBusyDone: function(result) {
        var self = this
        this._emit('wire-busy')
        return result.then(
            function(r) {
                self._emit('wire-done', { success: true })
                return Promise.resolve(r)
            },
            function(err) {
                self._emit('wire-done', { success: false })
                return Promise.reject(err)
            },
        )
    },
}

module.exports = SyncedGetPutDelete
