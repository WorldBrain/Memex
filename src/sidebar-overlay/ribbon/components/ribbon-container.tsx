import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import RootState, { MapDispatchToProps } from '../../types'
import Ribbon from './ribbon'
import * as actions from '../actions'
import * as selectors from '../selectors'

interface StateProps {
    isExpanded: boolean
    isRibbonEnabled: boolean
    isTooltipEnabled: boolean
}

interface DispatchProps {
    onInit: () => void
    handleRibbonToggle: () => void
    handleTooltipToggle: () => void
    handleMouseEnter: () => void
    handleMouseLeave: () => void
}

interface OwnProps {
    handleRemoveRibbon: () => void
    insertOrRemoveTooltip: (isTooltipEnabled: boolean) => void
    openSidebar: () => void
}

type Props = StateProps & DispatchProps & OwnProps

class RibbonContainer extends React.Component<Props> {
    private ribbonRef: HTMLElement

    componentDidMount() {
        this._setupHoverListeners()
        this.props.onInit()
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

    private _handleTooltipToggle = () => {
        this.props.insertOrRemoveTooltip(this.props.isTooltipEnabled)
        this.props.handleTooltipToggle()
    }

    render() {
        const {
            isExpanded,
            isRibbonEnabled,
            isTooltipEnabled,
            openSidebar,
            handleRibbonToggle,
            handleRemoveRibbon,
        } = this.props

        return (
            <div ref={this._setRibbonRef}>
                <Ribbon
                    isExpanded={isExpanded}
                    isRibbonEnabled={isRibbonEnabled}
                    isTooltipEnabled={isTooltipEnabled}
                    openSidebar={openSidebar}
                    handleRibbonToggle={handleRibbonToggle}
                    handleTooltipToggle={this._handleTooltipToggle}
                    handleRemoveRibbon={handleRemoveRibbon}
                />
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
    onInit: () => dispatch(actions.initState()),
    handleRibbonToggle: () => dispatch(actions.toggleRibbon()),
    handleTooltipToggle: () => dispatch(actions.toggleTooltip()),
    handleMouseEnter: () => dispatch(actions.setIsExpanded(true)),
    handleMouseLeave: () => dispatch(actions.setIsExpanded(false)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(RibbonContainer)
