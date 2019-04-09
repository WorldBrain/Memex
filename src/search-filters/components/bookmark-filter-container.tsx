import React, { PureComponent } from 'react'
import { connect, MapStateToProps, MapDispatchToProps } from 'react-redux'
import { RootState } from 'src/options/types'
import { actions, selectors } from '../'

import cx from 'classnames'

const styles = require('./bookmark-filter.css')

interface StateProps {
    bookmarkFilter: boolean
}

interface DispatchProps {
    onShowOnlyBookmarksChange: () => void
}

interface OwnProps {}

type Props = StateProps & DispatchProps & OwnProps

class BookmarkFilter extends PureComponent<Props> {
    render() {
        return (
            <div className={styles.container}>
                <label className={styles.label} htmlFor="toggle-bookmark">
                    <input
                        id="toggle-bookmark"
                        className={styles.label__checkbox}
                        type="checkbox"
                        checked={this.props.bookmarkFilter}
                        onChange={this.props.onShowOnlyBookmarksChange}
                    />
                    <span className={styles.label__text}>
                        <span className={styles.label__check}>
                            <span
                                className={cx(styles.icon, {
                                    [styles.checkedIcon]: this.props
                                        .bookmarkFilter,
                                })}
                            />
                        </span>
                    </span>
                </label>
            </div>
        )
    }
}

const mapStateToProps: MapStateToProps<StateProps, OwnProps, RootState> = (
    state,
): StateProps => ({
    bookmarkFilter: selectors.onlyBookmarks(state),
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps
> = dispatch => ({
    onShowOnlyBookmarksChange: () => {
        dispatch(actions.toggleBookmarkFilter())
    },
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(BookmarkFilter)
