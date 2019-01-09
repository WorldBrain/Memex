import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import RootState, { MapDispatchToProps } from '../types'
import RibbonContainer, {
    actions as ribbonActions,
    selectors as ribbonSelectors,
} from '../ribbon'
import SidebarContainer, {
    selectors as sidebarSelectors,
} from '../../sidebar-common'
import AnnotationsManager from '../../sidebar-common/annotations-manager'

interface StateProps {
    isPageFullScreen: boolean
    isSidebarOpen: boolean
}

interface DispatchProps {
    handleToggleFullScreen: (e: Event) => void
}

interface OwnProps {
    annotationsManager: AnnotationsManager
    handleRemoveRibbon: () => void
}

type Props = StateProps & DispatchProps & OwnProps

class RibbonSidebarContainer extends React.Component<Props> {
    componentDidMount() {
        this._setupFullScreenListener()
    }

    componentWillUnmount() {
        this._removeFullScreenListener()
    }

    private _setupFullScreenListener = () => {
        const { handleToggleFullScreen } = this.props
        document.addEventListener('fullscreenchange', handleToggleFullScreen)
    }

    private _removeFullScreenListener = () => {
        const { handleToggleFullScreen } = this.props
        document.removeEventListener('fullscreenchange', handleToggleFullScreen)
    }

    render() {
        const {
            annotationsManager,
            handleRemoveRibbon,
            isPageFullScreen,
            isSidebarOpen,
        } = this.props

        return (
            <React.Fragment>
                {!isSidebarOpen &&
                    !isPageFullScreen && (
                        <RibbonContainer
                            handleRemoveRibbon={handleRemoveRibbon}
                        />
                    )}
                <SidebarContainer
                    env="inpage"
                    annotationsManager={annotationsManager}
                />
            </React.Fragment>
        )
    }
}

const mapStateToProps: MapStateToProps<
    StateProps,
    OwnProps,
    RootState
> = state => ({
    isPageFullScreen: ribbonSelectors.isPageFullScreen(state),
    isSidebarOpen: sidebarSelectors.isOpen(state),
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps
> = dispatch => ({
    handleToggleFullScreen: e => {
        e.stopPropagation()
        dispatch(ribbonActions.toggleFullScreen())
    },
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(RibbonSidebarContainer)
