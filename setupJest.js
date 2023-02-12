require('core-js')
const util = require('util')

global.TextEncoder = util.TextEncoder
global.TextDecoder = util.TextDecoder

global.browser = global.browser ?? {}
global.browser.runtime = global.browser.runtime ?? {}
global.browser.runtime.id = global.browser.runtime ?? 'test-id'

global.chrome = global.chrome ?? {}
global.chrome.runtime = global.chrome.runtime ?? {}
global.chrome.runtime.id = global.chrome.runtime ?? 'test-id'

global.fetch = require('jest-fetch-mock')
global.URL = require('url').URL
global.DataTransfer = function () {
    this.data = ''
    this.img = undefined

    this.setData = (format, dataString) => (this.data = dataString)
    this.getData = (format) => this.data
    this.setDragImage = (img) => (this.img = img)
}

global.document = global.document ?? {}
global.document.execCommand = () => true

global.ResizeObserver = class ResizeObserver {
    observe() {}
    disconnect() {}
}
