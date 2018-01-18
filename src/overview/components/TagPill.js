import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import localStyles from './TagPill.css'

const getTagClass = noBg =>
    classNames(localStyles.tagname, {
        [localStyles.notExpanded]: !noBg,
    })

const TagPill = ({ value, noBg = false, onClick = f => f, setRef }) => (
    <span ref={setRef} className={getTagClass(noBg)} onClick={onClick}>
        {value}
    </span>
)

TagPill.propTypes = {
    value: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    noBg: PropTypes.bool,
    setRef: PropTypes.func,
}

export default TagPill
