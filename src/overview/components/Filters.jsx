import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import localStyles from './Filters.css'

const iconClasses = classNames({
    'material-icons': true,
    [localStyles.icon]: true,
})

const Filters = ({
    showOnlyBookmarks,
    onShowOnlyBookmarksChange,
    onShowFilterChange,
}) => (
    <div className={localStyles.filtersMain}>
        <div className={localStyles.bookmarks}>
            <input
                type="checkbox"
                name="showOnlyBookmarks"
                id="showOnlyBookmarks"
                checked={showOnlyBookmarks}
                onChange={onShowOnlyBookmarksChange}
            />
            <label htmlFor="showOnlyBookmarks">
                <span className={localStyles.checkboxText}>
                    Only Show Bookmarks
                </span>
            </label>
        </div>
        <div onClick={onShowFilterChange} className={localStyles.clear}>
            <i className={iconClasses}>clear</i>
        </div>
    </div>
)

Filters.propTypes = {
    showOnlyBookmarks: PropTypes.bool.isRequired,
    onShowOnlyBookmarksChange: PropTypes.func.isRequired,
    onShowFilterChange: PropTypes.func.isRequired,
}

export default Filters
