import { connect } from 'react-redux'

import BlacklistConfirm, { Props } from './BlacklistConfirm'
import * as acts from '../actions'

const mapDispatch = (dispatch): Props => ({
    onConfirmClick: e => {
        e.preventDefault()
        dispatch(acts.deleteBlacklistData())
    },
    onDenyClick: e => {
        e.preventDefault()
        dispatch(acts.setShowBlacklistDelete(false))
    },
})

export default connect<{}, Props, {}>(
    null,
    mapDispatch,
)(BlacklistConfirm)
