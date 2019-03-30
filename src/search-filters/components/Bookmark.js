import React, { PureComponent } from 'react'
// import styles from './Bookmark.module.css'
import { Bookmarkbox } from 'src/common-ui/components'

import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { actions, selectors } from '../'

class Bookmark extends PureComponent {
    static propTypes = {
        bookmarkFilter: PropTypes.bool.isRequired,
        onShowOnlyBookmarksChange: PropTypes.func.isRequired,
    }

    render() {
        return (
            <React.Fragment>
                <Bookmarkbox
                    id="toggle-bookmark"
                    isChecked={this.props.bookmarkFilter}
                    handleChange={this.props.onShowOnlyBookmarksChange}
                />
            </React.Fragment>
        )
    }
}

const mapStateToProps = state => ({
    bookmarkFilter: selectors.onlyBookmarks(state),
})

const mapDispatchToProps = dispatch => ({
    onShowOnlyBookmarksChange: () => {
        dispatch(actions.toggleBookmarkFilter())
    },
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Bookmark)
