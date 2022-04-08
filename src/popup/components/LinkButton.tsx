import React, { PureComponent } from 'react'

import OutLink from 'src/common-ui/containers/OutLink'
import Button from './Button'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import styled from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

const styles = require('./Button.css')
const LinkButtonStyles = require('src/popup/collections-button/components/CollectionsButton.css')

interface Props {
    goToDashboard: () => void
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
            <ButtonItem onClick={this.props.goToDashboard}>
                <SectionCircle>
                    <Icon
                        filePath={icons.searchIcon}
                        heightAndWidth="18px"
                        hoverOff
                    />
                </SectionCircle>
                <ButtonInnerContent>
                    Search Memex
                    <SubTitle>{this.state.highlightInfo}</SubTitle>
                </ButtonInnerContent>
            </ButtonItem>
        )
    }
}

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
    justify-content: flex-start;
    height: 50px;
    cursor: pointer;
    border-radius: 8px;
    padding: 5px 10px;
    margin: 10px;
    cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};

    &:hover {
        background: ${(props) => props.theme.colors.backgroundColorDarker};
    }

    & * {
        cursor: 'pointer';
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

export default LinkButton
