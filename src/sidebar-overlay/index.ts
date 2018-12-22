import SidebarContainer from './container'

/** New stuff */
import * as actions from './actions'
import reducer from './reducer'
import * as selectors from './selectors'
import State from './types'
/** New stuff end */

export default SidebarContainer
export { default as CloseButton } from './components/close-button'

/** New stuff */
export { actions, reducer, selectors, State }
/** New stuff end */
