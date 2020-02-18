import { connect } from 'react-redux'

import Modals from './Modals'
import * as acts from '../actions'

const mapState = state => ({
    modalId: state.modals.modalId,
    modalOptions: state.modals.modalOptions,
})

const mapDispatch = dispatch => ({
    onClosed: () => dispatch(acts.closed({})),
    onClose: () => dispatch(acts.close()),
})

export const ModalsContainer = connect(mapState, mapDispatch)(Modals)
