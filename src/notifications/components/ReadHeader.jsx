import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import styles from './ReadHeader.css'

const isExpanded = expanded =>
    classNames(styles.expIcon, {
        [styles.expanded]: expanded,
    })

const ReadHeader = props => (
    <div className={styles.readHeader} onClick={props.toggleReadExpand}>
        <span>
            {!props.isReadExpanded ? (
                <span>See Previous</span>
            ) : (
                <span>Hide Previous</span>
            )}
        </span>
        <span
            className={isExpanded(props.isReadExpanded)}
        />
    </div>
)

ReadHeader.propTypes = {
    isReadExpanded: PropTypes.bool.isRequired,
    toggleReadExpand: PropTypes.func.isRequired,
}

export default ReadHeader
