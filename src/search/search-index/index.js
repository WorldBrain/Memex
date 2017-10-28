import levelup from 'levelup'
import createQueue from 'queue'

import LevelJS from './level-js-to-leveldown'

export const DEFAULT_TERM_SEPARATOR = /[|' .,\-|(\n)]+/
export const URL_SEPARATOR = /[/?#=+& _.,\-|(\n)]+/

const index = levelup(new LevelJS('worldbrain-terms'))

// Set up queue to handle scheduling index update requests
const indexQueue = createQueue({
    autostart: true, // Always running, waiting for jobs to come in
    timeout: 10 * 1000, // Don't hold the queue up forever if something goes wrong
    concurrency: 1, // Only one DB-related task should be happening at once
})

indexQueue.on('timeout', next => next())

export { indexQueue }
export default index
