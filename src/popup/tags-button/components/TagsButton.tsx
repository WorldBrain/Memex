import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import Button from '../../components/Button'
import { ClickHandler, RootState } from '../../types'
import * as acts from '../actions'
import * as popup from '../../selectors'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import styled from 'styled-components'

const styles = require('./TagsButton.css')
const buttonStyles = require('../../components/Button.css')

export interface OwnProps {
    fetchTags?: () => Promise<string[]>
}

interface StateProps {
    isDisabled: boolean
}

interface DispatchProps {
    toggleTagPopup: ClickHandler<HTMLButtonElement>
    toggleAllTabsPopup: ClickHandler<HTMLButtonElement>
}

export type Props = OwnProps & StateProps & DispatchProps

class TagsButton extends PureComponent<Props> {
    async componentDidMount() {
        await this.getKeyboardShortcutText()

        const hasTags = await this.props.fetchTags()

        if (hasTags.length > 0) {
            this.setState({
                hasTags: true,
            })
        }
    }

    state = {
        highlightInfo: undefined,
        hasTags: false,
    }

    private async getKeyboardShortcutText() {
        const { shortcutsEnabled, addTag } = await getKeyboardShortcutsState()

        if (!shortcutsEnabled || !addTag.enabled) {
            this.setState({
                highlightInfo: `${addTag.shortcut} (disabled)`,
            })
        } else
            this.setState({
                highlightInfo: `${addTag.shortcut}`,
            })
    }

    render() {
        return (
            <ButtonItem
                onClick={!this.props.isDisabled && this.props.toggleTagPopup}
                disabled={this.props.isDisabled}
            >
                <SectionCircle>
                    <Icon
                        filePath={
                            // this.state.hasTags ? icons.tagFull : icons.tagEmpty
                            icons.tagEmpty
                        }
                        heightAndWidth="18px"
                        hoverOff
                    />
                </SectionCircle>
                <ButtonInnerContent>
                    Add Tag(s)
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
    border-radius: 8px;
    align-items: center;
    justify-content: flex-start;
    padding: 5px 10px;
    margin: 0px 10px 10px 10px;
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
    isDisabled: !popup.isLoggable(state),
})

const mapDispatch = (dispatch): DispatchProps => ({
    toggleTagPopup: (event) => {
        event.preventDefault()
        dispatch(acts.setAllTabs(false))
        dispatch(acts.toggleShowTagsPicker())
    },
    toggleAllTabsPopup: (event) => {
        event.preventDefault()
        dispatch(acts.setAllTabs(true))
        dispatch(acts.toggleShowTagsPicker())
    },
})

export default connect<StateProps, DispatchProps, OwnProps>(
    mapState,
    mapDispatch,
)(TagsButton)
