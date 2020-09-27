import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import cx from 'classnames'

import Button from '../../components/Button'
import { RootState, ClickHandler } from '../../types'
import * as selectors from '../selectors'
import * as acts from '../actions'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'


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
        highlightInfo: undefined
    }


    private async getKeyboardShortcutText() {
        const {
            shortcutsEnabled,
            createBookmark,
        } = await getKeyboardShortcutsState()

        if (!shortcutsEnabled || !createBookmark.enabled) {
            this.setState({
                highlightInfo: `${createBookmark.shortcut} (disabled)`
            }) 
        } else (
            this.setState({
                highlightInfo: `${createBookmark.shortcut}`
            }) 
        )
    }

    render() {
        const text = this.props.isBookmarked
            ? 'Un-Bookmark this Page'
            : 'Bookmark this Page'

        return (
            <div className={styles.buttonContainer}>
                <Button
                    onClick={this.props.toggleBookmark}
                    title={'Bookmark'}
                    btnClass={cx({
                        [styles.bookmarkedBtn]: this.props.isBookmarked,
                        [styles.unbookmarkedBtn]: !this.props.isBookmarked,
                    })}
                    itemClass={styles.button}
                    disabled={this.props.isDisabled}
                >
                    {text}
                    <p className={buttonStyles.subTitle}>
                        {this.state.highlightInfo}
                    </p>
                </Button>
            </div>
        )
    }
}

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = state => ({
    isBookmarked: selectors.isBookmarked(state),
    isDisabled: selectors.isDisabled(state),
})

const mapDispatch: (dispatch, props: OwnProps) => DispatchProps = (
    dispatch,
    props,
) => ({
    toggleBookmark: async e => {
        e.preventDefault()
        await dispatch(acts.toggleBookmark())
    },
})

export default connect(mapState, mapDispatch)(BookmarkButton)
