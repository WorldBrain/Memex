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
        <span>See Previous</span>
        <img
            className={isExpanded(props.isReadExpanded)}
            src="/img/triangle.svg"
        />
    </div>
)

ReadHeader.propTypes = {
    isReadExpanded: PropTypes.bool.isRequired,
    toggleReadExpand: PropTypes.func.isRequired,
}

export default ReadHeader
