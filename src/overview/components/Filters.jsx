import React from 'react'
import PropTypes from 'prop-types'

import localStyles from './Filters.css'

const Filters = () => (
    <div className={localStyles.filtersMain}>
        <div className={localStyles.bookmarks}>
            <input
                type="checkbox"
                name="showOnlyBookmarks"
                id="showOnlyBookmarks"
            />
            <label htmlFor="showOnlyBookmarks">
                <span className={localStyles.checkboxText}>
                    Only Show Bookmarks
                </span>
            </label>
        </div>
    </div>
)

export default Filters
