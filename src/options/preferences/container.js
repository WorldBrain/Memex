import { connect } from 'react-redux'

import Preferences from './components/Preferences'
import * as selectors from './selectors'
import * as actions from './actions'

const mapStateToProps = state => ({
    freezeDryBookmarks: selectors.freezeDryBookmarks(state),
})

const mapDispatchToProps = dispatch => ({
    toggleFreezeDryBookmarks: () => dispatch(actions.toggleFreezeDryBookmarks()),
})

export default connect(mapStateToProps, mapDispatchToProps)(Preferences)
