import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import RibbonContainer from '../../ribbon'
import RootState from '../types'
import SidebarContainer, { selectors as sidebarSelectors } from '../../sidebar'
import { MapDispatchToProps } from '../../types'
import * as actions from '../actions'

interface StateProps {
    isSidebarOpen: boolean
}

interface DispatchProps {
    onInit: () => void
}

interface OwnProps {
    handleRemoveRibbon: () => void
}

type Props = StateProps & DispatchProps & OwnProps

class RibbonSidebarController extends React.Component<Props> {
    componentDidMount() {
        this.props.onInit()
    }

    render() {
        const { handleRemoveRibbon, isSidebarOpen } = this.props

        return (
            <React.Fragment>
                {!isSidebarOpen && (
                    <RibbonContainer handleRemoveRibbon={handleRemoveRibbon} />
                )}
                {isSidebarOpen && <SidebarContainer />}
            </React.Fragment>
        )
    }
}

const mapStateToProps: MapStateToProps<
    StateProps,
    OwnProps,
    RootState
> = state => ({
    isSidebarOpen: sidebarSelectors.isOpen(state),
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps
> = dispatch => ({
    onInit: () => dispatch(actions.initState()),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(RibbonSidebarController)
