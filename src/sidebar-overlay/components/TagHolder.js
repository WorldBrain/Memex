import React from 'react'
import PropTypes from 'prop-types'
import styles from './TagHolder.css'

/**
 * Dummy Tag Holder to display all the tags
 */
const TagHolder = ({ tags, clickHandler }) => {
    return (
        <div className={styles.tagHolder} onClick={clickHandler}>
            {!tags.length ? (
                <span className={styles.placeholder}>Tag Comment...</span>
            ) : null}
            {tags.map(tag => (
                <span key={tag} className={styles.tag}>
                    {tag}
                </span>
            ))}
        </div>
    )
}

TagHolder.propTypes = {
    tags: PropTypes.arrayOf(PropTypes.string).isRequired,
    clickHandler: PropTypes.func.isRequired,
}

export default TagHolder
