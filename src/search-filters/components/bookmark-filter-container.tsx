import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { MapDispatchToProps } from 'src/util/types'
import { RootState } from 'src/options/types'
import * as actions from 'src/search-filters/actions'
import * as selectors from 'src/search-filters/selectors'

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
                <button
                    className={cx(styles.button, {
                        [styles.bookmark]: this.props.bookmarkFilter,
                        [styles.notBookmark]: !this.props.bookmarkFilter,
                    })}
                    onClick={this.props.onShowOnlyBookmarksChange}
                />
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
    OwnProps,
    RootState
> = dispatch => ({
    onShowOnlyBookmarksChange: () => dispatch(actions.toggleBookmarkFilter()),
})

export default connect(mapStateToProps, mapDispatchToProps)(BookmarkFilter)
