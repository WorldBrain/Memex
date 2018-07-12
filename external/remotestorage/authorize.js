var log = require('./log')
var util = require('./util')

function extractParams(url) {
    //FF already decodes the URL fragment in document.location.hash, so use this instead:
    var location = url || Authorize.getLocation().href,
        hashPos = location.indexOf('#'),
        hash
    if (hashPos === -1) {
        return
    }
    hash = location.substring(hashPos + 1)
    // if hash is not of the form #key=val&key=val, it's probably not for us
    if (hash.indexOf('=') === -1) {
        return
    }
    return hash.split('&').reduce(function(params, kvs) {
        var kv = kvs.split('=')

        if (kv[0] === 'state' && kv[1].match(/rsDiscovery/)) {
            // extract rsDiscovery data from the state param
            var stateValue = decodeURIComponent(kv[1])
            var encodedData = stateValue
                .substr(stateValue.indexOf('rsDiscovery='))
                .split('&')[0]
                .split('=')[1]

            params['rsDiscovery'] = JSON.parse(atob(encodedData))

            // remove rsDiscovery param
            stateValue = stateValue.replace(
                new RegExp('&?rsDiscovery=' + encodedData),
                '',
            )

            if (stateValue.length > 0) {
                params['state'] = stateValue
            }
        } else {
            params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1])
        }

        return params
    }, {})
}

var Authorize = function(remoteStorage, authURL, scope, redirectUri, clientId) {
    log(
        '[Authorize] authURL = ',
        authURL,
        'scope = ',
        scope,
        'redirectUri = ',
        redirectUri,
        'clientId = ',
        clientId,
    )

    // keep track of the discovery data during redirect if we can't save it in localStorage
    if (
        !util.localStorageAvailable() &&
        remoteStorage.backend === 'remotestorage'
    ) {
        redirectUri += redirectUri.indexOf('#') > 0 ? '&' : '#'

        var discoveryData = {
            userAddress: remoteStorage.remote.userAddress,
            href: remoteStorage.remote.href,
            storageApi: remoteStorage.remote.storageApi,
            properties: remoteStorage.remote.properties,
        }

        redirectUri += 'rsDiscovery=' + btoa(JSON.stringify(discoveryData))
    }

    var url = authURL,
        hashPos = redirectUri.indexOf('#')
    url += authURL.indexOf('?') > 0 ? '&' : '?'
    url += 'redirect_uri=' + encodeURIComponent(redirectUri.replace(/#.*$/, ''))
    url += '&scope=' + encodeURIComponent(scope)
    url += '&client_id=' + encodeURIComponent(clientId)
    if (hashPos !== -1 && hashPos + 1 !== redirectUri.length) {
        url +=
            '&state=' + encodeURIComponent(redirectUri.substring(hashPos + 1))
    }
    url += '&response_type=token'

    if (util.globalContext.cordova) {
        return Authorize.openWindow(
            url,
            redirectUri,
            'location=yes,clearsessioncache=yes,clearcache=yes',
        ).then(function(authResult) {
            remoteStorage.remote.configure({
                token: authResult.access_token,
            })
        })
    }

    Authorize.setLocation(url)
}

Authorize.IMPLIED_FAKE_TOKEN = false

Authorize.Unauthorized = function(message, options = {}) {
    this.name = 'Unauthorized'

    if (typeof message === 'undefined') {
        this.message = 'App authorization expired or revoked.'
    } else {
        this.message = message
    }

    if (typeof options.code !== 'undefined') {
        this.code = options.code
    }

    this.stack = new Error().stack
}
Authorize.Unauthorized.prototype = Object.create(Error.prototype)
Authorize.Unauthorized.prototype.constructor = Authorize.Unauthorized

/**
 * Get current document location
 *
 * Override this method if access to document.location is forbidden
 */
Authorize.getLocation = function() {
    return document.location
}

/**
 * Set current document location
 *
 * Override this method if access to document.location is forbidden
 */
Authorize.setLocation = function(location) {
    if (typeof location === 'string') {
        document.location.href = location
    } else if (typeof location === 'object') {
        document.location = location
    } else {
        throw 'Invalid location ' + location
    }
}

/**
 * Open new InAppBrowser window for OAuth in Cordova
 */
Authorize.openWindow = function(url, redirectUri, options) {
    return new Promise((resolve, reject) => {
        var newWindow = open(url, '_blank', options)

        if (!newWindow || newWindow.closed) {
            return reject('Authorization popup was blocked')
        }

        var handleExit = function() {
            return reject('Authorization was canceled')
        }

        var handleLoadstart = function(event) {
            if (event.url.indexOf(redirectUri) !== 0) {
                return
            }

            newWindow.removeEventListener('exit', handleExit)
            newWindow.close()

            var authResult = extractParams(event.url)

            if (!authResult) {
                return reject('Authorization error')
            }

            return resolve(authResult)
        }

        newWindow.addEventListener('loadstart', handleLoadstart)
        newWindow.addEventListener('exit', handleExit)
    })
}

Authorize._rs_supported = function() {
    return typeof document !== 'undefined'
}

var onFeaturesLoaded
Authorize._rs_init = function(remoteStorage) {
    onFeaturesLoaded = function() {
        var authParamsUsed = false
        if (params) {
            if (params.error) {
                if (params.error === 'access_denied') {
                    throw new Authorize.Unauthorized(
                        'Authorization failed: access denied',
                        { code: 'access_denied' },
                    )
                } else {
                    throw new Authorize.Unauthorized(
                        `Authorization failed: ${params.error}`,
                    )
                }
            }

            // rsDiscovery came with the redirect, because it couldn't be
            // saved in localStorage
            if (params.rsDiscovery) {
                remoteStorage.remote.configure(params.rsDiscovery)
            }

            if (params.access_token) {
                remoteStorage.remote.configure({
                    token: params.access_token,
                })
                authParamsUsed = true
            }
            if (params.remotestorage) {
                remoteStorage.connect(params.remotestorage)
                authParamsUsed = true
            }
            if (params.state) {
                location = Authorize.getLocation()
                Authorize.setLocation(
                    location.href.split('#')[0] + '#' + params.state,
                )
            }
        }
        if (!authParamsUsed) {
            remoteStorage.remote.stopWaitingForToken()
        }
    }
    var params = extractParams(),
        location
    if (params) {
        location = Authorize.getLocation()
        location.hash = ''
    }
    remoteStorage.on('features-loaded', onFeaturesLoaded)
}

Authorize._rs_cleanup = function(remoteStorage) {
    remoteStorage.removeEventListener('features-loaded', onFeaturesLoaded)
}

module.exports = Authorize
