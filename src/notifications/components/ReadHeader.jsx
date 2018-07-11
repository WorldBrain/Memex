import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import localStyles from './ReadHeader.css'

const isExpanded = expanded =>
    classNames(localStyles.expIcon, {
        [localStyles.expanded]: expanded,
    })

const ReadHeader = props => (
    <div className={localStyles.readHeader} onClick={props.toggleReadExpand}>
        <span>Read</span>
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
