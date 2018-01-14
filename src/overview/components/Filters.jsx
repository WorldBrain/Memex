import React from 'react'
import PropTypes from 'prop-types'

import localStyles from './Filters.css'

const Filters = ({
    showOnlyBookmarks,
    onShowOnlyBookmarksChange,
    clearAllFilters,
    isClearFilterButtonShown,
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
        <div
            style={{
                visibility: `${isClearFilterButtonShown
                    ? 'visible'
                    : 'hidden'}`,
            }}
            className={localStyles.clearDiv}
        >
            {isClearFilterButtonShown && (
                <button
                    type="button"
                    onClick={clearAllFilters}
                    className={localStyles.clear}
                >
                    Clear Filters
                </button>
            )}
        </div>
    </div>
)

Filters.propTypes = {
    showOnlyBookmarks: PropTypes.bool.isRequired,
    onShowOnlyBookmarksChange: PropTypes.func.isRequired,
    clearAllFilters: PropTypes.func.isRequired,
    isClearFilterButtonShown: PropTypes.bool.isRequired,
}

export default Filters
