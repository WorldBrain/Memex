import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import { ToggleSwitchButton } from '../../components/ToggleSwitchButton'
import type { RootState } from '../../types'
import * as selectors from '../selectors'
import * as acts from '../actions'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import styled from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { CheckboxToggle } from 'src/common-ui/components'

const buttonStyles = require('../../components/Button.css')

export interface OwnProps {
    closePopup: () => void
}

interface StateProps {
    isEnabled: boolean
}

interface DispatchProps {
    handleChange: CheckboxToggle
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
            <ButtonItem>
                <ButtonInnerContainer onClick={this.props.openSidebar}>
                    <SectionCircle>
                        <Icon
                            filePath={icons.sidebarIcon}
                            heightAndWidth="18px"
                            hoverOff
                        />
                    </SectionCircle>
                    <ButtonInnerContent>
                        Open Annotation Sidebar
                        <SubTitle>{this.state.highlightInfo}</SubTitle>
                    </ButtonInnerContent>
                </ButtonInnerContainer>
                <ToggleSwitchButton
                    toggleHoverText="Enable Permanently"
                    isEnabled={this.props.isEnabled}
                    onToggleClick={this.props.handleChange}
                />
            </ButtonItem>
        )
    }
}

const ButtonInnerContainer = styled.div`
    display: flex;
    grid-gap: 15px;
`

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.backgroundHighlight}80;
    border-radius: 100px;
    height: 32px;
    width: 32px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const ButtonItem = styled.div<{ disabled: boolean }>`
    display: flex;
    grid-gap: 15px;
    width: fill-available;
    align-items: center;
    justify-content: space-between;
    padding: 5px 10px;
    margin: 10px 10px 0px 10px;
    border-radius: 8px;
    height: 50px;
    cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};

    &:hover {
        background: ${(props) => props.theme.colors.backgroundColorDarker};
    }

    & * {
        cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
    }
`

const ButtonInnerContent = styled.div`
    display: flex;
    grid-gap: 5px;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    font-size: 14px;
    font-weight: 600;
    color: ${(props) => props.theme.colors.darkerText};
`

const SubTitle = styled.div`
    font-size: 12px;
    color: ${(props) => props.theme.colors.lighterText};
    font-weight: 400;
`

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = (state) => ({
    isEnabled: selectors.isSidebarEnabled(state),
})

const mapDispatch: (dispatch, props: OwnProps) => DispatchProps = (
    dispatch,
    props,
) => ({
    openSidebar: async (e) => {
        e.preventDefault()
        props.closePopup()
        await dispatch(acts.openSideBar())
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
