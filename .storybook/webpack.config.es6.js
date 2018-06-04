import path from 'path'
import initConf from '../build'

module.exports = initConf({
    context: path.resolve(__dirname, '..'),
    mode: 'development',
    injectStyles: true,
})
