import React from 'react'
import PropTypes from 'prop-types'

import styles from './Preferences.css'

const Preferences = ({ toggleFreezeDryBookmarks, freezeDryBookmarks, toggleFreezeDryArchive, freezeDryArchive }) => (
    <div>
        <ul className={styles.flagsList}>
            <li className={styles.flagsListItem}>
                <input
                    type='checkbox'
                    id='freezeDryBookmarksCheckbox'
                    onChange={toggleFreezeDryBookmarks}
                    checked={freezeDryBookmarks}
                    disabled={!freezeDryArchive}
                />
                <label htmlFor='freezeDryBookmarksCheckbox'>Store bookmarks for offline viewing</label>
            </li>
            <li className={styles.flagsListItem}>
                <input
                    type='checkbox'
                    id='freezeDryArchiveCheckbox'
                    onChange={toggleFreezeDryArchive}
                    checked={freezeDryArchive}
                />
                <label htmlFor='freezeDryArchiveCheckbox'>Archiving Pages</label>
            </li>
        </ul>
    </div>
)

Preferences.propTypes = {
    freezeDryBookmarks: PropTypes.bool.isRequired,
    toggleFreezeDryBookmarks: PropTypes.func.isRequired,
    freezeDryArchive: PropTypes.bool.isRequired,
    toggleFreezeDryArchive: PropTypes.func.isRequired,
}

export default Preferences
