import reducer from './reducer'
import * as actions from './actions'
import * as epics from './epics'
import * as constants from './constants'
import enhancer from './enhancer'
import Overview from './components/Overview'

export default {reducer, actions, epics, constants, enhancer, components: { Overview }}
