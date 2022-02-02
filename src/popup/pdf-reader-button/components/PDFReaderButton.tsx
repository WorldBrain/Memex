import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import { ToggleSwitchButton } from '../../components/ToggleSwitchButton'
import type { RootState } from '../../types'
import * as selectors from '../selectors'
import * as acts from '../actions'
import { CheckboxToggle } from 'src/common-ui/components'
import styled from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

const buttonStyles = require('../../components/Button.css')

export interface OwnProps {}

interface StateProps {
    isEnabled: boolean
    pdfMode: string
    onBtnClick: () => void
    onToggleClick: () => void
}

interface DispatchProps {}

export type Props = OwnProps & StateProps & DispatchProps

class PDFreaderButton extends PureComponent<Props> {
    render() {
        return (
            <ButtonItem>
                <ButtonInnerContainer onClick={this.props.onBtnClick}>
                    <SectionCircle>
                        <Icon
                            filePath={icons.highlighterEmpty}
                            heightAndWidth="18px"
                            hoverOff
                        />
                    </SectionCircle>
                    <ButtonInnerContent>
                        {this.props.pdfMode === 'reader'
                            ? 'Close PDF reader'
                            : 'Open PDF reader'}
                        <SubTitle>when selecting text on current page</SubTitle>
                    </ButtonInnerContent>
                </ButtonInnerContainer>
                <ToggleSwitchButton
                    toggleHoverText={'Open every PDF with the reader'}
                    isEnabled={this.props.isEnabled}
                    onToggleClick={this.props.onToggleClick}
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
    padding: 5px 10px 5px 20px;
    height: 55px;
    cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};

    &:hover {
        background: ${(props) => props.theme.colors.backgroundColor};
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

export default PDFreaderButton
