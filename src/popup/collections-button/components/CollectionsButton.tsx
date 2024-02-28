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
    getRootElement: () => HTMLElement
}

interface StateProps {
    isDisabled: boolean
}

interface DispatchProps {
    toggleCollectionsPopup: ClickHandler<HTMLDivElement>
    toggleAllTabsPopup: ClickHandler<HTMLDivElement>
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
                onClick={(event) => {
                    if (!this.props.isDisabled) {
                        this.props.toggleCollectionsPopup(event)
                    }
                }}
                disabled={this.props.isDisabled}
            >
                <Icon
                    filePath={
                        this.props.pageListsIds.length > 0
                            ? icons.plus
                            : icons.plus
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
    border-radius: 8px;
    align-items: center;
    justify-content: flex-start;
    padding: 0px 10px;
    margin: 0px 10px 10px 10px;
    height: 50px;

    cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
    border: 1px solid transparent;

    &:hover {
        border: 1px solid ${(props) => props.theme.colors.greyScale3};
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
    color: ${(props) => props.theme.colors.greyScale6};
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
