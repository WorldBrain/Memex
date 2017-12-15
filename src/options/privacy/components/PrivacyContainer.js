import { connect } from 'react-redux'

import * as actions from '../actions'
import * as selectors from '../selectors'
import Privacy from './Privacy'

const mapStateToProps = state => ({
    shouldTrack: selectors.shouldTrack(state),
})

const mapDispatchToProps = dispatch => ({
    handleTrackChange: event =>
        dispatch(actions.toggleTrackingOptOut(event.target.value)),
})

export default connect(mapStateToProps, mapDispatchToProps)(Privacy)
