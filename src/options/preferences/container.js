import { connect } from 'react-redux'

import Preferences from './components/Preferences'
import * as selectors from './selectors'
import * as actions from './actions'

const mapStateToProps = state => ({
    freezeDryBookmarks: selectors.freezeDryBookmarks(state),
    freezeDryArchive: selectors.freezeDryArchive(state),
})

const mapDispatchToProps = dispatch => ({
    toggleFreezeDryBookmarks: () => dispatch(actions.toggleFreezeDryBookmarks()),
    toggleFreezeDryArchive: () => dispatch(actions.toggleFreezeDryArchive()),
})

export default connect(mapStateToProps, mapDispatchToProps)(Preferences)
