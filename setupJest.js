require.requireActual('core-js')

global.fetch = require('jest-fetch-mock')
global.URL = require('url').URL
global.DataTransfer = function () {
    this.data = ''
    this.setData = (format, dataString) => (this.data = dataString)
    this.getData = (format) => this.data
}
