import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import { ToggleSwitchButton } from '../../components/ToggleSwitchButton'
import type { RootState } from '../../types'
import * as selectors from '../selectors'
import * as acts from '../actions'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'

const buttonStyles = require('../../components/Button.css')

export interface OwnProps {
    closePopup: () => void
}

interface StateProps {
    isEnabled: boolean
}

interface DispatchProps {
    handleChange: React.MouseEventHandler
    openSidebar: React.MouseEventHandler
    initState: () => Promise<void>
}

interface State {
    highlightInfo?: string
}

export type Props = OwnProps & StateProps & DispatchProps

class TooltipButton extends PureComponent<Props, State> {
    async componentDidMount() {
        await this.props.initState()
        await this.getHighlightContextMenuTitle()
    }

    state: State = { highlightInfo: undefined }

    private async getHighlightContextMenuTitle() {
        const {
            shortcutsEnabled,
            toggleSidebar,
        } = await getKeyboardShortcutsState()

        if (!shortcutsEnabled || !toggleSidebar.enabled) {
            this.setState({
                highlightInfo: `${toggleSidebar.shortcut} (disabled)`,
            })
        } else this.setState({ highlightInfo: `${toggleSidebar.shortcut}` })
    }

    render() {
        return (
            <ToggleSwitchButton
                btnIcon={buttonStyles.sidebarIcon}
                btnText="Open Sidebar"
                btnHoverText="Open Memex annotation sidebar"
                toggleHoverText="Enable/disable Memex annotation sidebar on all pages"
                btnSubText={this.state.highlightInfo}
                isEnabled={this.props.isEnabled}
                onBtnClick={this.props.openSidebar}
                onToggleClick={this.props.handleChange}
            />
        )
    }
}

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = (state) => ({
    isEnabled: selectors.isSidebarEnabled(state),
})

const mapDispatch: (dispatch, props: OwnProps) => DispatchProps = (
    dispatch,
    props,
) => ({
    openSidebar: async (e) => {
        e.preventDefault()
        await dispatch(acts.openSideBar())
        setTimeout(props.closePopup, 200)
    },
    handleChange: async (e) => {
        e.stopPropagation()
        e.preventDefault()
        await dispatch(acts.toggleSidebarFlag())
        // setTimeout(props.closePopup, 200)
    },
    initState: () => dispatch(acts.init()),
})

export default connect<StateProps, DispatchProps, OwnProps>(
    mapState,
    mapDispatch,
)(TooltipButton)
