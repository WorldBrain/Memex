import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import { ClickHandler, MapDispatchToProps } from '../../types'
import { RootState } from '../../ribbon-sidebar-controller'
import Ribbon from './ribbon'
import * as actions from '../actions'
import * as selectors from '../selectors'
import { actions as sidebarActions } from '../../sidebar'

interface StateProps {
    isExpanded: boolean
    isRibbonEnabled: boolean
    isTooltipEnabled: boolean
}

interface DispatchProps {
    openSidebar: ClickHandler<HTMLImageElement>
    handleRibbonToggle: ClickHandler<HTMLElement>
    handleTooltipToggle: ClickHandler<HTMLElement>
    handleMouseEnter: (e: MouseEvent) => void
    handleMouseLeave: (e: MouseEvent) => void
}

interface OwnProps {
    handleRemoveRibbon: ClickHandler<HTMLElement>
}

type Props = StateProps & DispatchProps & OwnProps

class RibbonContainer extends React.Component<Props> {
    private ribbonRef: HTMLElement

    componentDidMount() {
        this._setupHoverListeners()
    }

    componentWillUnmount() {
        this._removeHoverListeners()
    }

    private _setupHoverListeners() {
        this.ribbonRef.addEventListener(
            'mouseenter',
            this.props.handleMouseEnter,
        )
        this.ribbonRef.addEventListener(
            'mouseleave',
            this.props.handleMouseLeave,
        )
    }

    private _removeHoverListeners() {
        this.ribbonRef.removeEventListener(
            'mouseenter',
            this.props.handleMouseEnter,
        )
        this.ribbonRef.removeEventListener(
            'mouseleave',
            this.props.handleMouseLeave,
        )
    }

    private _setRibbonRef = (ref: HTMLElement) => {
        this.ribbonRef = ref
    }

    render() {
        return (
            <div ref={this._setRibbonRef}>
                <Ribbon {...this.props} />
            </div>
        )
    }
}

const mapStateToProps: MapStateToProps<
    StateProps,
    OwnProps,
    RootState
> = state => ({
    isExpanded: selectors.isExpanded(state),
    isRibbonEnabled: selectors.isRibbonEnabled(state),
    isTooltipEnabled: selectors.isTooltipEnabled(state),
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps
> = dispatch => ({
    openSidebar: e => {
        e.stopPropagation()
        dispatch(actions.shrinkRibbon())
        dispatch(sidebarActions.setSidebarOpen(true))
    },
    handleRibbonToggle: e => {
        e.stopPropagation()
        dispatch(actions.toggleRibbon())
    },
    handleTooltipToggle: e => {
        e.stopPropagation()
        dispatch(actions.toggleTooltip())
    },
    handleMouseEnter: e => {
        e.stopPropagation()
        dispatch(actions.expandRibbon())
    },
    handleMouseLeave: e => {
        e.stopPropagation()
        dispatch(actions.shrinkRibbon())
    },
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(RibbonContainer)
