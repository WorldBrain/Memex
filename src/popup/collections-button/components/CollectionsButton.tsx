import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import { ClickHandler, RootState } from '../../types'
import * as acts from '../actions'
import * as popup from '../../selectors'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import styled from 'styled-components'
import KeyboardShortcuts from '@worldbrain/memex-common/lib/common-ui/components/keyboard-shortcuts'

export interface OwnProps {
    pageListsIds: number[]
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
                <Icon
                    filePath={
                        this.props.pageListsIds.length > 0
                            ? icons.collectionsFull
                            : icons.collectionsEmpty
                    }
                    heightAndWidth="22px"
                    hoverOff
                    color={
                        this.props.pageListsIds.length > 0
                            ? 'prime1'
                            : 'greyScale6'
                    }
                />
                <ButtonInnerContent>
                    Add Page to Spaces
                    <ShortCutContainer>
                        <KeyboardShortcuts
                            keys={this.state.highlightInfo?.split('+')}
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

const ShortCutText = styled.div`
    display: block;
    font-weight: 400;
    color: ${(props) => props.theme.colors.greyScale6};
    letter-spacing: 1px;
    margin-right: -1px;

    &:first-letter {
        text-transform: capitalize;
    }
`

const ShortCutBlock = styled.div`
    border-radius: 5px;
    border: 1px solid ${(props) => props.theme.colors.greyScale10};
    color: ${(props) => props.theme.colors.greyScale6};
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
    border-radius: 8px;
    align-items: center;
    justify-content: flex-start;
    padding: 0px 10px;
    margin: 0px 10px 10px 10px;
    height: 50px;
    cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};

    &:hover {
        background: ${(props) => props.theme.colors.greyScale3};
    }

    & * {
        cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
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
    color: ${(props) => props.theme.colors.white};
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
