require.requireActual('babel-polyfill')
require.requireActual('core-js/es7/symbol')
global.fetch = require('jest-fetch-mock')
