import { connect } from 'react-redux'

import AdvSettings from './AdvSettings'
import * as selectors from '../selectors'
import * as actions from '../actions'

const mapStateToProps = state => ({
    advMode: selectors.advMode(state),
    concurrency: selectors.concurrency(state),
    isUploading: selectors.isUploading(state),
})

const mapDispatchToProps = dispatch => ({
    toggleAdvMode: () => dispatch(actions.toggleAdvMode()),
    onConcurrencyChange: event =>
        dispatch(actions.setConcurrencyLevel(+event.target.value)),
    uploadTestData: event =>
        dispatch(actions.uploadTestData(event.target.files || [])),
})

export default connect(mapStateToProps, mapDispatchToProps)(AdvSettings)
