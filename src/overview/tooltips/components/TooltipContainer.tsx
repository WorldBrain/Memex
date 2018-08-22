import { connect } from 'react-redux'

import Tooltip, { Props } from './Tooltip'
import * as acts from '../actions'
import * as selectors from '../selectors'
import { selectors as results } from '../../results'
import { RootState } from '../../../options/types'

const mapStateToProps: (state: RootState) => Partial<Props> = state => ({
    showTooltip: selectors.showTooltip(state),
    tooltip: selectors.tooltip(state),
    isTooltipRenderable: selectors.isTooltipRenderable(state),
    scrollDisabled: results.isScrollDisabled(state),
})

const mapDispatchToProps: (dispatch) => Partial<Props> = dispatch => ({
    toggleShowTooltip: event => {
        event.preventDefault()
        dispatch(acts.toggleShowTooltip())
    },
    fetchNextTooltip: event => {
        event.preventDefault()
        dispatch(acts.nextTooltip())
    },
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Tooltip)
