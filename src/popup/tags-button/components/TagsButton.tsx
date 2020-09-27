import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import Button from '../../components/Button'
import { ClickHandler, RootState } from '../../types'
import * as acts from '../actions'
import * as popup from '../../selectors'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'


const styles = require('./TagsButton.css')
const buttonStyles = require('../../components/Button.css')


export interface OwnProps {}

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
    }

    state = {
        highlightInfo: undefined
    }


    private async getKeyboardShortcutText() {
        const {
            shortcutsEnabled,
            addTag,
        } = await getKeyboardShortcutsState()

        if (!shortcutsEnabled || !addTag.enabled) {
            this.setState({
                highlightInfo: `${addTag.shortcut} (disabled)`
            }) 
        } else (
            this.setState({
                highlightInfo: `${addTag.shortcut}`
            }) 
        )
    }


    render() {
        return (
            <div className={styles.buttonContainer}>
                <Button
                    onClick={this.props.toggleTagPopup}
                    disabled={this.props.isDisabled}
                    btnClass={styles.tag}
                    itemClass={styles.button}
                >
                    Add Tag(s)
                    <p className={buttonStyles.subTitle}>
                            {this.state.highlightInfo}
                    </p>
                </Button>
            </div>
        )
    }
}

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
