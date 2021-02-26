require.requireActual('core-js')

global.fetch = require('jest-fetch-mock')
global.URL = require('url').URL
global.DataTransfer = function () {
    this.data = ''
    this.img = undefined

    this.setData = (format, dataString) => (this.data = dataString)
    this.getData = (format) => this.data
    this.setDragImage = (img) => (this.img = img)
}
