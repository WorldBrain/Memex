require.requireActual('babel-polyfill')
global.fetch = require('jest-fetch-mock')
global.URL = require('url').URL
