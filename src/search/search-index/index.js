// import stopword from 'stopword'
import levelup from 'levelup'

import LevelJS from './level-js-to-leveldown'

export const DEFAULT_TERM_SEPARATOR = /[|' .,\-|(\n)]+/

const index = levelup(new LevelJS('worldbrain-terms'))

export default index
