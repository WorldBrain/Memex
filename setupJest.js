require.requireActual('core-js')

global.fetch = require('jest-fetch-mock')
global.URL = require('url').URL
