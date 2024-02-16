import React, { PureComponent } from 'react'

import OutLink from 'src/common-ui/containers/OutLink'
import Button from './Button'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import styled from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import KeyboardShortcuts from '@worldbrain/memex-common/lib/common-ui/components/keyboard-shortcuts'

const styles = require('./Button.css')
const LinkButtonStyles = require('src/popup/collections-button/components/CollectionsButton.css')

interface Props {
    goToDashboard: () => void
    getRootElement: () => HTMLElement
}

class LinkButton extends PureComponent<Props> {
    async componentDidMount() {
        await this.getKeyboardShortcutText()
    }

    state = {
        highlightInfo: undefined,
    }

    private async getKeyboardShortcutText() {
        const {
            shortcutsEnabled,
            openDashboard,
        } = await getKeyboardShortcutsState()

        if (!shortcutsEnabled || !openDashboard.enabled) {
            this.setState({
                highlightInfo: `${openDashboard.shortcut} (disabled)`,
            })
        } else
            this.setState({
                highlightInfo: `${openDashboard.shortcut}`,
            })
    }

    render() {
        return (
            <ButtonItem disabled={false} onClick={this.props.goToDashboard}>
                <Icon
                    filePath={icons.searchIcon}
                    heightAndWidth="22px"
                    hoverOff
                />
                <ButtonInnerContent>
                    Search & Dashboard
                    <ShortCutContainer>
                        <KeyboardShortcuts
                            keys={this.state.highlightInfo?.split('+')}
                            getRootElement={this.props.getRootElement}
                        />
                    </ShortCutContainer>
                </ButtonInnerContent>
            </ButtonItem>
        )
    }
}

const ShortCutContainer = styled.div`
    display: flex;
    align-items: center;
    color: ${(props) => props.theme.colors.greyScale6};
    grid-gap: 3px;
`

const ButtonItem = styled.div<{ disabled: boolean }>`
    display: flex;
    grid-gap: 15px;
    width: fill-available;
    align-items: center;
    justify-content: flex-start;
    height: 50px;
    cursor: pointer;
    border-radius: 8px;
    padding: 0px 10px;
    margin: 10px 10px 0 10px;
    cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
    border: 1px solid transparent;

    &:hover {
        border: 1px solid ${(props) => props.theme.colors.greyScale3};
    }

    & * {
        cursor: 'pointer';
    }
`

const ButtonInnerContent = styled.div`
    display: flex;
    grid-gap: 5px;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    font-weight: 500;
    width: 100%;
    color: ${(props) => props.theme.colors.greyScale6};
`

const SubTitle = styled.div`
    font-size: 12px;
    color: ${(props) => props.theme.colors.greyScale5};
    font-weight: 400;
`

export default LinkButton
