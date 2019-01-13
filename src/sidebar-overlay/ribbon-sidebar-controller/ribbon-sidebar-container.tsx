import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import { makeRemotelyCallable } from '../../util/webextensionRPC'
import RootState, { MapDispatchToProps } from '../types'
import RibbonContainer, {
    actions as ribbonActions,
    selectors as ribbonSelectors,
} from '../ribbon'
import SidebarContainer, {
    actions as sidebarActions,
    selectors as sidebarSelectors,
} from '../../sidebar-common'
import { actions as commentBoxActions } from '../../sidebar-common/comment-box'
import AnnotationsManager from '../../sidebar-common/annotations-manager'
import { Anchor } from '../../direct-linking/content_script/interactions'

interface StateProps {
    isPageFullScreen: boolean
    isSidebarOpen: boolean
}

interface DispatchProps {
    handleToggleFullScreen: (e: Event) => void
    openSidebar: () => void
    openCommentBoxWithHighlight: (anchor: Anchor) => void
}

interface OwnProps {
    annotationsManager: AnnotationsManager
    handleRemoveRibbon: () => void
}

type Props = StateProps & DispatchProps & OwnProps

class RibbonSidebarContainer extends React.Component<Props> {
    componentDidMount() {
        this._setupFullScreenListener()
        this._setupRPC()
    }

    componentWillUnmount() {
        this._removeFullScreenListener()
    }

    private _setupRPC = () => {
        makeRemotelyCallable({
            openSidebar: async (anchor: Anchor = null) => {
                await this.props.openSidebar()
                if (anchor) {
                    this.props.openCommentBoxWithHighlight(anchor)
                }
            },
        })
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
    openSidebar: () => dispatch(sidebarActions.openSidebar()),
    openCommentBoxWithHighlight: anchor =>
        dispatch(commentBoxActions.openCommentBoxWithHighlight(anchor)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(RibbonSidebarContainer)
