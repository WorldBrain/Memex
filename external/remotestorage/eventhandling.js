var log = require('./log')

/**
 * @interface
 */
var methods = {
    /**
     * Install an event handler for the given event name
     */
    addEventListener: function(eventName, handler) {
        if (typeof eventName !== 'string') {
            throw new Error('Argument eventName should be a string')
        }
        if (typeof handler !== 'function') {
            throw new Error('Argument handler should be a function')
        }
        log('[Eventhandling] Adding event listener', eventName)
        this._validateEvent(eventName)
        this._handlers[eventName].push(handler)
    },

    /**
     * Remove a previously installed event handler
     */
    removeEventListener: function(eventName, handler) {
        this._validateEvent(eventName)
        var hl = this._handlers[eventName].length
        for (var i = 0; i < hl; i++) {
            if (this._handlers[eventName][i] === handler) {
                this._handlers[eventName].splice(i, 1)
                return
            }
        }
    },

    _emit: function(eventName) {
        this._validateEvent(eventName)
        var args = Array.prototype.slice.call(arguments, 1)
        this._handlers[eventName].slice().forEach(function(handler) {
            handler.apply(this, args)
        })
    },

    _validateEvent: function(eventName) {
        if (!(eventName in this._handlers)) {
            throw new Error('Unknown event: ' + eventName)
        }
    },

    _delegateEvent: function(eventName, target) {
        target.on(
            eventName,
            function(event) {
                this._emit(eventName, event)
            }.bind(this),
        )
    },

    _addEvent: function(eventName) {
        this._handlers[eventName] = []
    },
}

/**
 * Alias for ``addEventListener``
 **/
methods.on = methods.addEventListener

/**
 * Alias for ``removeEventListener``
 **/
methods.off = methods.removeEventListener

/**
 * Mixes event handling functionality into an object.
 *
 * The first parameter is always the object to be extended.
 * All remaining parameter are expected to be strings, interpreted as valid event
 * names.
 *
 * @example
 * var MyConstructor = function () {
 *   eventHandling(this, 'connected', 'disconnected');
 *
 *   this._emit('connected');
 *   this._emit('disconnected');
 *   // This would throw an exception:
 *   // this._emit('something-else');
 * };
 *
 * var myObject = new MyConstructor();
 * myObject.on('connected', function () { console.log('connected'); });
 * myObject.on('disconnected', function () { console.log('disconnected'); });
 * // This would throw an exception as well:
 * // myObject.on('something-else', function () {});
 */
module.exports = function(object) {
    var eventNames = Array.prototype.slice.call(arguments, 1)
    for (var key in methods) {
        object[key] = methods[key]
    }
    object._handlers = {}
    eventNames.forEach(function(eventName) {
        object._addEvent(eventName)
    })
}
