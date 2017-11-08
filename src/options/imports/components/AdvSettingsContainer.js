import { connect } from 'react-redux'

import AdvSettings from './AdvSettings'
import * as selectors from '../selectors'
import { toggleAdvMode, uploadTestData } from '../actions'

const mapStateToProps = state => ({
    advMode: selectors.advMode(state),
    isUploading: selectors.isUploading(state),
})

const mapDispatchToProps = dispatch => ({
    toggleAdvMode: () => dispatch(toggleAdvMode()),
    uploadTestData: event => dispatch(uploadTestData(event.target.files || [])),
})

export default connect(mapStateToProps, mapDispatchToProps)(AdvSettings)
