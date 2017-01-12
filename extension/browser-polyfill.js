/* webextension-polyfill - v0.1.0 - Sun Dec 18 2016 23:04:23 */
/* -*- Mode: indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* vim: set sts=2 sw=2 et tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

if (typeof browser === "undefined") {
  // Wrapping the bulk of this polyfill in a one-time-use function is a minor
  // optimization for Firefox. Since Spidermonkey does not fully parse the
  // contents of a function until the first time it's called, and since it will
  // never actually need to be called, this allows the polyfill to be included
  // in Firefox nearly for free.
  const wrapAPIs = () => {
    const apiMetadata = {
      "alarms": {
        "clear": {
          "minArgs": 0,
          "maxArgs": 1
        },
        "clearAll": {
          "minArgs": 0,
          "maxArgs": 0
        },
        "get": {
          "minArgs": 0,
          "maxArgs": 1
        },
        "getAll": {
          "minArgs": 0,
          "maxArgs": 0
        }
      },
      "bookmarks": {
        "create": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "export": {
          "minArgs": 0,
          "maxArgs": 0
        },
        "get": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "getChildren": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "getRecent": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "getTree": {
          "minArgs": 0,
          "maxArgs": 0
        },
        "getSubTree": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "import": {
          "minArgs": 0,
          "maxArgs": 0
        },
        "move": {
          "minArgs": 2,
          "maxArgs": 2
        },
        "remove": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "removeTree": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "search": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "update": {
          "minArgs": 2,
          "maxArgs": 2
        }
      },
      "browserAction": {
        "getBadgeBackgroundColor": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "getBadgeText": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "getPopup": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "getTitle": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "setIcon": {
          "minArgs": 1,
          "maxArgs": 1
        }
      },
      "commands": {
        "getAll": {
          "minArgs": 0,
          "maxArgs": 0
        }
      },
      "contextMenus": {
        "update": {
          "minArgs": 2,
          "maxArgs": 2
        },
        "remove": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "removeAll": {
          "minArgs": 0,
          "maxArgs": 0
        }
      },
      "cookies": {
        "get": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "getAll": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "getAllCookieStores": {
          "minArgs": 0,
          "maxArgs": 0
        },
        "remove": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "set": {
          "minArgs": 1,
          "maxArgs": 1
        }
      },
      "downloads": {
        "download": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "cancel": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "erase": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "getFileIcon": {
          "minArgs": 1,
          "maxArgs": 2
        },
        "open": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "pause": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "removeFile": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "resume": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "search": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "show": {
          "minArgs": 1,
          "maxArgs": 1
        }
      },
      "extension": {
        "isAllowedFileSchemeAccess": {
          "minArgs": 0,
          "maxArgs": 0
        },
        "isAllowedIncognitoAccess": {
          "minArgs": 0,
          "maxArgs": 0
        }
      },
      "history": {
        "addUrl": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "getVisits": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "deleteAll": {
          "minArgs": 0,
          "maxArgs": 0
        },
        "deleteRange": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "deleteUrl": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "search": {
          "minArgs": 1,
          "maxArgs": 1
        }
      },
      "i18n": {
        "detectLanguage": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "getAcceptLanguages": {
          "minArgs": 0,
          "maxArgs": 0
        }
      },
      "idle": {
        "queryState": {
          "minArgs": 1,
          "maxArgs": 1
        }
      },
      "management": {
        "get": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "getAll": {
          "minArgs": 0,
          "maxArgs": 0
        },
        "getSelf": {
          "minArgs": 0,
          "maxArgs": 0
        },
        "uninstallSelf": {
          "minArgs": 0,
          "maxArgs": 1
        }
      },
      "notifications": {
        "clear": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "create": {
          "minArgs": 1,
          "maxArgs": 2
        },
        "getAll": {
          "minArgs": 0,
          "maxArgs": 0
        },
        "getPermissionLevel": {
          "minArgs": 0,
          "maxArgs": 0
        },
        "update": {
          "minArgs": 2,
          "maxArgs": 2
        }
      },
      "pageAction": {
        "getPopup": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "getTitle": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "hide": {
          "minArgs": 0,
          "maxArgs": 0
        },
        "setIcon": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "show": {
          "minArgs": 0,
          "maxArgs": 0
        }
      },
      "runtime": {
        "getBackgroundPage": {
          "minArgs": 0,
          "maxArgs": 0
        },
        "getBrowserInfo": {
          "minArgs": 0,
          "maxArgs": 0
        },
        "getPlatformInfo": {
          "minArgs": 0,
          "maxArgs": 0
        },
        "openOptionsPage": {
          "minArgs": 0,
          "maxArgs": 0
        },
        "requestUpdateCheck": {
          "minArgs": 0,
          "maxArgs": 0
        },
        "sendMessage": {
          "minArgs": 1,
          "maxArgs": 3
        },
        "sendNativeMessage": {
          "minArgs": 2,
          "maxArgs": 2
        },
        "setUninstallURL": {
          "minArgs": 1,
          "maxArgs": 1
        }
      },
      "storage": {
        "local": {
          "clear": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "get": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getBytesInUse": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "set": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "managed": {
          "get": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getBytesInUse": {
            "minArgs": 0,
            "maxArgs": 1
          }
        },
        "sync": {
          "clear": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "get": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getBytesInUse": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "set": {
            "minArgs": 1,
            "maxArgs": 1
          }
        }
      },
      "tabs": {
        "create": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "captureVisibleTab": {
          "minArgs": 0,
          "maxArgs": 2
        },
        "detectLanguage": {
          "minArgs": 0,
          "maxArgs": 1
        },
        "duplicate": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "executeScript": {
          "minArgs": 1,
          "maxArgs": 2
        },
        "get": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "getCurrent": {
          "minArgs": 0,
          "maxArgs": 0
        },
        "getZoom": {
          "minArgs": 0,
          "maxArgs": 1
        },
        "getZoomSettings": {
          "minArgs": 0,
          "maxArgs": 1
        },
        "highlight": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "insertCSS": {
          "minArgs": 1,
          "maxArgs": 2
        },
        "move": {
          "minArgs": 2,
          "maxArgs": 2
        },
        "reload": {
          "minArgs": 0,
          "maxArgs": 2
        },
        "remove": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "query": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "removeCSS": {
          "minArgs": 1,
          "maxArgs": 2
        },
        "sendMessage": {
          "minArgs": 2,
          "maxArgs": 3
        },
        "setZoom": {
          "minArgs": 1,
          "maxArgs": 2
        },
        "setZoomSettings": {
          "minArgs": 1,
          "maxArgs": 2
        },
        "update": {
          "minArgs": 1,
          "maxArgs": 2
        }
      },
      "webNavigation": {
        "getAllFrames": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "getFrame": {
          "minArgs": 1,
          "maxArgs": 1
        }
      },
      "webRequest": {
        "handlerBehaviorChanged": {
          "minArgs": 0,
          "maxArgs": 0
        }
      },
      "windows": {
        "create": {
          "minArgs": 0,
          "maxArgs": 1
        },
        "get": {
          "minArgs": 1,
          "maxArgs": 2
        },
        "getAll": {
          "minArgs": 0,
          "maxArgs": 1
        },
        "getCurrent": {
          "minArgs": 0,
          "maxArgs": 1
        },
        "getLastFocused": {
          "minArgs": 0,
          "maxArgs": 1
        },
        "remove": {
          "minArgs": 1,
          "maxArgs": 1
        },
        "update": {
          "minArgs": 2,
          "maxArgs": 2
        }
      }
    };

    /**
     * A WeakMap subclass which creates and stores a value for any key which does
     * not exist when accessed, but behaves exactly as an ordinary WeakMap
     * otherwise.
     *
     * @param {function} createItem
     *        A function which will be called in order to create the value for any
     *        key which does not exist, the first time it is accessed. The
     *        function receives, as its only argument, the key being created.
     */
    class DefaultWeakMap extends WeakMap {
      constructor(createItem, items = undefined) {
        super(items);
        this.createItem = createItem;
      }

      get(key) {
        if (!this.has(key)) {
          this.set(key, this.createItem(key));
        }

        return super.get(key);
      }
    }

    /**
     * Returns true if the given object is an object with a `then` method, and can
     * therefore be assumed to behave as a Promise.
     *
     * @param {*} value The value to test.
     * @returns {boolean} True if the value is thenable.
     */
    const isThenable = value => {
      return value && typeof value === "object" && typeof value.then === "function";
    };

    /**
     * Creates and returns a function which, when called, will resolve or reject
     * the given promise based on how it is called:
     *
     * - If, when called, `chrome.runtime.lastError` contains a non-null object,
     *   the promise is rejected with that value.
     * - If the function is called with exactly one argument, the promise is
     *   resolved to that value.
     * - Otherwise, the promise is resolved to an array containing all of the
     *   function's arguments.
     *
     * @param {object} promise
     *        An object containing the resolution and rejection functions of a
     *        promise.
     * @param {function} promise.resolve
     *        The promise's resolution function.
     * @param {function} promise.rejection
     *        The promise's rejection function.
     *
     * @returns {function}
     *        The generated callback function.
     */
    const makeCallback = promise => {
      return (...callbackArgs) => {
        if (chrome.runtime.lastError) {
          promise.reject(chrome.runtime.lastError);
        } else if (callbackArgs.length === 1) {
          promise.resolve(callbackArgs[0]);
        } else {
          promise.resolve(callbackArgs);
        }
      };
    };

    /**
     * Creates a wrapper function for a method with the given name and metadata.
     *
     * @param {string} name
     *        The name of the method which is being wrapped.
     * @param {object} metadata
     *        Metadata about the method being wrapped.
     * @param {integer} metadata.minArgs
     *        The minimum number of arguments which must be passed to the
     *        function. If called with fewer than this number of arguments, the
     *        wrapper will raise an exception.
     * @param {integer} metadata.maxArgs
     *        The maximum number of arguments which may be passed to the
     *        function. If called with more than this number of arguments, the
     *        wrapper will raise an exception.
     *
     * @returns {function(object, ...*)}
     *       The generated wrapper function.
     */
    const wrapAsyncFunction = (name, metadata) => {
      const pluralizeArguments = (numArgs) => numArgs == 1 ? "argument" : "arguments";

      return function asyncFunctionWrapper(target, ...args) {
        if (args.length < metadata.minArgs) {
          throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
        }

        if (args.length > metadata.maxArgs) {
          throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
        }

        return new Promise((resolve, reject) => {
          target[name](...args, makeCallback({resolve, reject}));
        });
      };
    };

    /**
     * Wraps an existing method of the target object, so that calls to it are
     * intercepted by the given wrapper function. The wrapper function receives,
     * as its first argument, the original `target` object, followed by each of
     * the arguments passed to the orginal method.
     *
     * @param {object} target
     *        The original target object that the wrapped method belongs to.
     * @param {function} method
     *        The method being wrapped. This is used as the target of the Proxy
     *        object which is created to wrap the method.
     * @param {function} wrapper
     *        The wrapper function which is called in place of a direct invocation
     *        of the wrapped method.
     *
     * @returns {Proxy<function>}
     *        A Proxy object for the given method, which invokes the given wrapper
     *        method in its place.
     */
    const wrapMethod = (target, method, wrapper) => {
      return new Proxy(method, {
        apply(targetMethod, thisObj, args) {
          return wrapper.call(thisObj, target, ...args);
        },
      });
    };

    let hasOwnProperty = Function.call.bind(Object.prototype.hasOwnProperty);

    /**
     * Wraps an object in a Proxy which intercepts and wraps certain methods
     * based on the given `wrappers` and `metadata` objects.
     *
     * @param {object} target
     *        The target object to wrap.
     *
     * @param {object} [wrappers = {}]
     *        An object tree containing wrapper functions for special cases. Any
     *        function present in this object tree is called in place of the
     *        method in the same location in the `target` object tree. These
     *        wrapper methods are invoked as described in {@see wrapMethod}.
     *
     * @param {object} [metadata = {}]
     *        An object tree containing metadata used to automatically generate
     *        Promise-based wrapper functions for asynchronous. Any function in
     *        the `target` object tree which has a corresponding metadata object
     *        in the same location in the `metadata` tree is replaced with an
     *        automatically-generated wrapper function, as described in
     *        {@see wrapAsyncFunction}
     *
     * @returns {Proxy<object>}
     */
    const wrapObject = (target, wrappers = {}, metadata = {}) => {
      let cache = Object.create(null);

      let handlers = {
        has(target, prop) {
          return prop in target || prop in cache;
        },

        get(target, prop, receiver) {
          if (prop in cache) {
            return cache[prop];
          }

          if (!(prop in target)) {
            return undefined;
          }

          let value = target[prop];

          if (typeof value === "function") {
            // This is a method on the underlying object. Check if we need to do
            // any wrapping.

            if (typeof wrappers[prop] === "function") {
              // We have a special-case wrapper for this method.
              value = wrapMethod(target, target[prop], wrappers[prop]);
            } else if (hasOwnProperty(metadata, prop)) {
              // This is an async method that we have metadata for. Create a
              // Promise wrapper for it.
              let wrapper = wrapAsyncFunction(prop, metadata[prop]);
              value = wrapMethod(target, target[prop], wrapper);
            } else {
              // This is a method that we don't know or care about. Return the
              // original method, bound to the underlying object.
              value = value.bind(target);
            }
          } else if (typeof value === "object" && value !== null &&
                     (hasOwnProperty(wrappers, prop) ||
                      hasOwnProperty(metadata, prop))) {
            // This is an object that we need to do some wrapping for the children
            // of. Create a sub-object wrapper for it with the appropriate child
            // metadata.
            value = wrapObject(value, wrappers[prop], metadata[prop]);
          } else {
            // We don't need to do any wrapping for this property,
            // so just forward all access to the underlying object.
            Object.defineProperty(cache, prop, {
              configurable: true,
              enumerable: true,
              get() {
                return target[prop];
              },
              set(value) {
                target[prop] = value;
              },
            });

            return value;
          }

          cache[prop] = value;
          return value;
        },

        set(target, prop, value, receiver) {
          if (prop in cache) {
            cache[prop] = value;
          } else {
            target[prop] = value;
          }
          return true;
        },

        defineProperty(target, prop, desc) {
          return Reflect.defineProperty(cache, prop, desc);
        },

        deleteProperty(target, prop) {
          return Reflect.deleteProperty(cache, prop);
        },
      };

      return new Proxy(target, handlers);
    };

    /**
     * Creates a set of wrapper functions for an event object, which handles
     * wrapping of listener functions that those messages are passed.
     *
     * A single wrapper is created for each listener function, and stored in a
     * map. Subsequent calls to `addListener`, `hasListener`, or `removeListener`
     * retrieve the original wrapper, so that  attempts to remove a
     * previously-added listener work as expected.
     *
     * @param {DefaultWeakMap<function, function>} wrapperMap
     *        A DefaultWeakMap object which will create the appropriate wrapper
     *        for a given listener function when one does not exist, and retrieve
     *        an existing one when it does.
     *
     * @returns {object}
     */
    const wrapEvent = wrapperMap => ({
      addListener(target, listener, ...args) {
        target.addListener(wrapperMap.get(listener), ...args);
      },

      hasListener(target, listener) {
        return target.hasListener(wrapperMap.get(listener));
      },

      removeListener(target, listener) {
        target.removeListener(wrapperMap.get(listener));
      },
    });

    const onMessageWrappers = new DefaultWeakMap(listener => {
      if (typeof listener !== "function") {
        return listener;
      }

      /**
       * Wraps a message listener function so that it may send responses based on
       * its return value, rather than by returning a sentinel value and calling a
       * callback. If the listener function returns a Promise, the response is
       * sent when the promise either resolves or rejects.
       *
       * @param {*} message
       *        The message sent by the other end of the channel.
       * @param {object} sender
       *        Details about the sender of the message.
       * @param {function(*)} sendResponse
       *        A callback which, when called with an arbitrary argument, sends
       *        that value as a response.
       * @returns {boolean}
       *        True if the wrapped listener returned a Promise, which will later
       *        yield a response. False otherwise.
       */
      return function onMessage(message, sender, sendResponse) {
        let result = listener(message, sender);

        if (isThenable(result)) {
          result.then(sendResponse, error => {
            console.error(error);
            sendResponse(error);
          });

          return true;
        } else if (result !== undefined) {
          sendResponse(result);
        }
      };
    });

    const staticWrappers = {
      runtime: {
        onMessage: wrapEvent(onMessageWrappers),
      },
    };

    return wrapObject(chrome, staticWrappers, apiMetadata);
  };

  this.browser = wrapAPIs();
}
