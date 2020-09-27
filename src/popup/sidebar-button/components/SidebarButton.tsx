import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import Button from '../../components/Button'
import ToggleSwitch from '../../components/ToggleSwitch'
import { RootState, ClickHandler } from '../../types'
import * as selectors from '../selectors'
import * as acts from '../actions'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'


const styles = require('./SidebarButton.css')
const buttonStyles = require('../../components/Button.css')

export interface OwnProps {
    closePopup: () => void
}

interface StateProps {
    isEnabled: boolean
}

interface DispatchProps {
    handleChange: ClickHandler<HTMLButtonElement>
    openSidebar: ClickHandler<HTMLButtonElement>
    initState: () => Promise<void>
}

interface State {
    highlightInfo: string
}

export type Props = OwnProps & StateProps & DispatchProps

class TooltipButton extends PureComponent<Props> {
    async componentDidMount() {
        this.props.initState()
        await this.getHighlightContextMenuTitle()
    }

    state = {
        highlightInfo: undefined
    }


    private async getHighlightContextMenuTitle() {
        const {
            shortcutsEnabled,
            toggleSidebar,
        } = await getKeyboardShortcutsState()

        if (!shortcutsEnabled || !toggleSidebar.enabled) {
            this.setState({
                highlightInfo: `${toggleSidebar.shortcut} (disabled)`
            }) 
        } else (
            this.setState({
                highlightInfo: `${toggleSidebar.shortcut}`
            }) 
        )
    }

    render() {
        return (
            <div className={styles.switchBlocks}>
                <div className={styles.option}>
                    <Button
                        onClick={this.props.openSidebar}
                        itemClass={styles.button}
                        btnClass={buttonStyles.sidebarIcon}
                        title={'Open Memex annotation sidebar'}
                    >
                        Open Sidebar
                        <p className={buttonStyles.subTitle}>
                            {this.state.highlightInfo}
                        </p>
                    </Button>
                </div>
                <div
                    className={styles.switch}
                    title={
                        'Enable/disable Memex annotation sidebar on all pages'
                    }
                >
                    <ToggleSwitch
                        isChecked={this.props.isEnabled}
                        onChange={this.props.handleChange}
                    />
                </div>
            </div>
        )
    }
}

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = state => ({
    isEnabled: selectors.isSidebarEnabled(state),
})

const mapDispatch: (dispatch, props: OwnProps) => DispatchProps = (
    dispatch,
    props,
) => ({
    openSidebar: async e => {
        e.preventDefault()
        await dispatch(acts.openSideBar())
        setTimeout(props.closePopup, 200)
    },
    handleChange: async e => {
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
