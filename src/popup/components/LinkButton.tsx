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
                <Icon
                    filePath={icons.searchIcon}
                    heightAndWidth="22px"
                    hoverOff
                />
                <ButtonInnerContent>
                    Search & Dashboard
                    <ShortCutContainer>
                        <ShortCutBlock>
                            <ShortCutText>
                                {this.state.highlightInfo?.split('+')[0]}
                            </ShortCutText>
                        </ShortCutBlock>
                        +
                        <ShortCutBlock>
                            <ShortCutText>
                                {this.state.highlightInfo?.split('+')[1]}
                            </ShortCutText>
                        </ShortCutBlock>
                    </ShortCutContainer>
                </ButtonInnerContent>
            </ButtonItem>
        )
    }
}

const ShortCutContainer = styled.div`
    display: flex;
    align-items: center;
    color: ${(props) => props.theme.colors.greyScale9};
    grid-gap: 3px;
`

const ShortCutText = styled.div`
    display: block;
    font-weight: 400;
    color: ${(props) => props.theme.colors.greyScale9};
    letter-spacing: 1px;
    margin-right: -1px;

    &:first-letter {
        text-transform: capitalize;
    }
`

const ShortCutBlock = styled.div`
    border-radius: 5px;
    border: 1px solid ${(props) => props.theme.colors.greyScale10};
    color: ${(props) => props.theme.colors.greyScale9};
    display: flex;
    align-items: center;
    justify-content: center;
    height: 18px;
    padding: 0px 6px;
    font-size: 10px;
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
    justify-content: flex-start;
    height: 50px;
    cursor: pointer;
    border-radius: 8px;
    padding: 0px 10px;
    margin: 10px 10px 0 10px;
    cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};

    &:hover {
        background: ${(props) => props.theme.colors.lightHover};
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
    color: ${(props) => props.theme.colors.normalText};
`

const SubTitle = styled.div`
    font-size: 12px;
    color: ${(props) => props.theme.colors.lighterText};
    font-weight: 400;
`

export default LinkButton
