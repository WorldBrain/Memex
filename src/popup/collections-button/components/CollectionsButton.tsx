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

const styles = require('./CollectionsButton.css')
const buttonStyles = require('../../components/Button.css')

export interface OwnProps {
    fetchCollections?: () => Promise<string[]>
}

interface StateProps {
    isDisabled: boolean
}

interface DispatchProps {
    toggleCollectionsPopup: ClickHandler<HTMLButtonElement>
    toggleAllTabsPopup: ClickHandler<HTMLButtonElement>
}

export type Props = OwnProps & StateProps & DispatchProps

class CollectionsButton extends PureComponent<Props> {
    async componentDidMount() {
        await this.getKeyboardShortcutText()
        const hasCollections = await this.props.fetchCollections()

        if (hasCollections.length > 0) {
            this.setState({
                hasCollections: true,
            })
        }
    }

    state = {
        highlightInfo: undefined,
        hasCollections: false,
    }

    private async getKeyboardShortcutText() {
        const {
            shortcutsEnabled,
            addToCollection,
        } = await getKeyboardShortcutsState()

        if (!shortcutsEnabled || !addToCollection.enabled) {
            this.setState({
                highlightInfo: `${addToCollection.shortcut} (disabled)`,
            })
        } else
            this.setState({
                highlightInfo: `${addToCollection.shortcut}`,
            })
    }

    render() {
        return (
            <ButtonItem
                onClick={
                    !this.props.isDisabled && this.props.toggleCollectionsPopup
                }
                disabled={this.props.isDisabled}
            >
                <SectionCircle>
                    <Icon
                        filePath={
                            // this.state.hasCollections
                            //     ? icons.collectionsFull
                            //     : icons.collectionsEmpty
                            icons.collectionsEmpty
                        }
                        heightAndWidth="18px"
                        hoverOff
                    />
                </SectionCircle>
                <ButtonInnerContent>
                    Add to Spaces
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
    width: 100%;
    align-items: center;
    justify-content: flex-start;
    padding: 5px 20px;
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

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = (state) => ({
    isDisabled: !popup.isLoggable(state),
})

const mapDispatch = (dispatch): DispatchProps => ({
    toggleCollectionsPopup: (event) => {
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
)(CollectionsButton)
