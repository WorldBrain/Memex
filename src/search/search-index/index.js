import levelup from 'levelup'
import createQueue from 'queue'

import LevelJS from './level-js-to-leveldown'

export const DEFAULT_TERM_SEPARATOR = /[|' .,\-|(\n)]+/
export const URL_SEPARATOR = /[/?#=+& _.,\-|(\n)]+/

const index = levelup(new LevelJS('worldbrain-terms'))

const indexQueue = createQueue({
    autostart: true,
    timeout: 10 * 1000,
    concurrency: 1,
})

indexQueue.on('timeout', next => next())

export { indexQueue }
export default index
