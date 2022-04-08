import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import cx from 'classnames'

import Button from '../../components/Button'
import { RootState, ClickHandler } from '../../types'
import * as selectors from '../selectors'
import * as acts from '../actions'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import styled from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

const styles = require('./BookmarkButton.css')
const buttonStyles = require('../../components/Button.css')

export interface OwnProps {
    closePopup: () => void
}

interface StateProps {
    isDisabled: boolean
    isBookmarked: boolean
}

interface DispatchProps {
    toggleBookmark: ClickHandler<HTMLButtonElement>
}

export type Props = OwnProps & StateProps & DispatchProps

class BookmarkButton extends PureComponent<Props> {
    async componentDidMount() {
        await this.getKeyboardShortcutText()
    }

    state = {
        highlightInfo: undefined,
    }

    private async getKeyboardShortcutText() {
        const {
            shortcutsEnabled,
            createBookmark,
        } = await getKeyboardShortcutsState()

        if (!shortcutsEnabled || !createBookmark.enabled) {
            this.setState({
                highlightInfo: `${createBookmark.shortcut} (disabled)`,
            })
        } else
            this.setState({
                highlightInfo: `${createBookmark.shortcut}`,
            })
    }

    render() {
        const text = this.props.isBookmarked
            ? 'Page Boomarked!'
            : 'Bookmark this Page'

        return (
            <ButtonItem
                onClick={!this.props.isDisabled && this.props.toggleBookmark}
                disabled={this.props.isDisabled || this.props.isBookmarked}
            >
                <SectionCircle>
                    <Icon
                        filePath={
                            this.props.isBookmarked
                                ? icons.heartFull
                                : icons.heartEmpty
                        }
                        heightAndWidth="18px"
                        hoverOff
                    />
                </SectionCircle>
                <ButtonInnerContent>
                    {text}
                    <SubTitle>{this.state.highlightInfo}</SubTitle>
                </ButtonInnerContent>
            </ButtonItem>
        )
    }
}

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.backgroundHighlight}68;
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
    padding: 5px 10px;
    margin: 10px 10px 0px 10px;
    height: 50px;
    border-radius: 8px;
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
    isBookmarked: selectors.isBookmarked(state),
    isDisabled: selectors.isDisabled(state),
})

const mapDispatch: (dispatch, props: OwnProps) => DispatchProps = (
    dispatch,
    props,
) => ({
    toggleBookmark: async (e) => {
        e.preventDefault()
        await dispatch(acts.toggleBookmark())
    },
})

export default connect(mapState, mapDispatch)(BookmarkButton)
