import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import RootState, { ClickHandler, MapDispatchToProps } from '../../types'
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
    handleRibbonToggle: ClickHandler<HTMLElement>
    handleTooltipToggle: ClickHandler<HTMLElement>
    handleMouseEnter: (e: MouseEvent) => void
    handleMouseLeave: (e: MouseEvent) => void
}

interface OwnProps {
    handleRemoveRibbon: () => void
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

    render() {
        const { handleRemoveRibbon, openSidebar, ...rest } = this.props

        return (
            <div ref={this._setRibbonRef}>
                <Ribbon
                    {...rest}
                    handleRemoveRibbon={e => {
                        e.stopPropagation()
                        handleRemoveRibbon()
                    }}
                    openSidebar={e => {
                        e.stopPropagation()
                        openSidebar()
                    }}
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
        dispatch(actions.setIsExpanded(true))
    },
    handleMouseLeave: e => {
        e.stopPropagation()
        dispatch(actions.setIsExpanded(false))
    },
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(RibbonContainer)
