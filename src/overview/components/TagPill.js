import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import localStyles from './TagPill.css'

const getTagClass = tagnm =>
    classNames(localStyles.tagname, {
        [localStyles.notExpanded]: !(tagnm[0] === '+'),
    })

const TagPill = ({ value, onClick = f => f }) => (
    <span className={getTagClass(value)} onClick={onClick}>
        {value}
    </span>
)

TagPill.propTypes = {
    value: PropTypes.string.isRequired,
    onClick: PropTypes.func,
}

export default TagPill
