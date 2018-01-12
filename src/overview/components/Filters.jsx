import React from 'react'
import PropTypes from 'prop-types'

import localStyles from './Filters.css'

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
        {/* TODO: Toggle for Clear Filters button. Need to be modified according to new filters being added. */}
        {showOnlyBookmarks && (
            <div
                onClick={onShowOnlyBookmarksChange}
                className={localStyles.clear}
            >
                Clear Filters
            </div>
        )}
    </div>
)

Filters.propTypes = {
    showOnlyBookmarks: PropTypes.bool.isRequired,
    onShowOnlyBookmarksChange: PropTypes.func.isRequired,
    onShowFilterChange: PropTypes.func.isRequired,
}

export default Filters
