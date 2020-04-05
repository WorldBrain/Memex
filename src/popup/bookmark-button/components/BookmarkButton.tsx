import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import cx from 'classnames'

import Button from '../../components/Button'
import { RootState, ClickHandler } from '../../types'
import * as selectors from '../selectors'
import * as acts from '../actions'

const styles = require('./BookmarkButton.css')

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
    render() {
        const text = this.props.isBookmarked
            ? 'Un-Bookmark this Page'
            : 'Bookmark this Page'

        return (
            <Button
                onClick={this.props.toggleBookmark}
                title={'Bookmark'}
                btnClass={cx({
                    [styles.bookmarkedBtn]: this.props.isBookmarked,
                    [styles.unbookmarkedBtn]: !this.props.isBookmarked,
                })}
                disabled={this.props.isDisabled}
            >
                {text}
            </Button>
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
