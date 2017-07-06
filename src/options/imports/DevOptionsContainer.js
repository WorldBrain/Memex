import { connect } from 'react-redux'

import DevOptions from './components/DevOptions'
import * as selectors from './selectors'
import { toggleDevMode, uploadTestData } from './actions'

const mapStateToProps = state => ({
    devMode: selectors.devMode(state),
    isUploading: selectors.isUploading(state),
})

const mapDispatchToProps = dispatch => ({
    toggleDevMode: () => dispatch(toggleDevMode()),
    uploadTestData: event => dispatch(uploadTestData(event.target.files || [])),
})

export default connect(mapStateToProps, mapDispatchToProps)(DevOptions)
