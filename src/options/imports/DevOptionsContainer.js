import { connect } from 'react-redux'

import DevOptions from './components/DevOptions'
import * as selectors from './selectors'
import { toggleDevMode } from './actions'

const mapStateToProps = state => ({
    devMode: selectors.devMode(state),
    isRestoring: selectors.isRestoring(state),
})

const mapDispatchToProps = dispatch => ({
    toggleDevMode: () => dispatch(toggleDevMode()),
})

export default connect(mapStateToProps, mapDispatchToProps)(DevOptions)
