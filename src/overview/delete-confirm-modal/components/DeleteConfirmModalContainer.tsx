import { connect } from 'react-redux'

import DeleteConfirmModal from './DeleteConfirmModal'
import * as selectors from '../selectors'
import * as acts from '../actions'

const mapState = state => ({
    isShown: selectors.isShown(state),
})

const mapDispatch = dispatch => ({
    onClose: () => dispatch(acts.reset()),
    deleteDocs: () => dispatch(acts.deleteDocs()),
})

export default connect(
    mapState,
    mapDispatch,
)(DeleteConfirmModal)
