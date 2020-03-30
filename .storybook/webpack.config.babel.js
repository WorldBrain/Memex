import path from 'path'
import initConf from '../build'

export default initConf({
    context: path.resolve(__dirname, '..'),
    mode: 'development',
    injectStyles: true,
})
