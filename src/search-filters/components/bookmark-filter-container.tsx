import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { MapDispatchToProps } from 'src/util/types'
import { RootState } from 'src/options/types'
import { actions, selectors } from 'src/search-filters'

import cx from 'classnames'

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
            <div
                className={cx({
                    bookmark: this.props.bookmarkFilter,
                    notBookmark: !this.props.bookmarkFilter,
                })}
                onClick={this.props.onShowOnlyBookmarksChange}
            />
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
> = (dispatch) => ({
    onShowOnlyBookmarksChange: () => dispatch(actions.toggleBookmarkFilter()),
})

export default connect(mapStateToProps, mapDispatchToProps)(BookmarkFilter)
