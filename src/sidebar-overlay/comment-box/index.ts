import CommentBox from './components'
import * as actions from './actions'
import reducer, { defaultState } from './reducer'
import * as selectors from './selectors'
import State from './types'

export default CommentBox
export { actions, selectors, reducer, defaultState, State }
