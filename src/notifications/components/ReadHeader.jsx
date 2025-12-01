import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

const ReadHeader = (props) => (
    <div onClick={props.toggleReadExpand}>
        <span>
            {!props.isReadExpanded ? (
                <span>See Previous</span>
            ) : (
                <span>Hide Previous</span>
            )}
        </span>
        <span />
    </div>
)

ReadHeader.propTypes = {
    isReadExpanded: PropTypes.bool.isRequired,
    toggleReadExpand: PropTypes.func.isRequired,
}

export default ReadHeader
