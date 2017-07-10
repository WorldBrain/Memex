import React from 'react'
import PropTypes from 'prop-types'

import styles from './Preferences.css'

const Preferences = ({ toggleFreezeDryBookmarks, freezeDryBookmarks }) => (
    <div>
        <ul className={styles.flagsList}>
            <li className={styles.flagsListItem}>
                <input
                    type='checkbox'
                    id='freezeDryBookmarksCheckbox'
                    onChange={toggleFreezeDryBookmarks}
                    checked={freezeDryBookmarks}
                />
                <label htmlFor='freezeDryBookmarksCheckbox'>Store bookmarks for offline viewing</label>
            </li>
        </ul>
    </div>
)

Preferences.propTypes = {
    freezeDryBookmarks: PropTypes.bool.isRequired,
    toggleFreezeDryBookmarks: PropTypes.func.isRequired,
}

export default Preferences
