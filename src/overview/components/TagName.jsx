import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import localStyles from './TagName.css'

const getTagClass = tagnm =>
    classNames(localStyles.tagname, {
        [localStyles.notExpanded]: !(tagnm === '+1'),
    })

const TagName = ({ tagnm, handleClick }) => (
    <span className={getTagClass(tagnm)} onClick={e => handleClick(tagnm)(e)}>
        {tagnm}
    </span>
)

TagName.propTypes = {
    tagnm: PropTypes.string.isRequired,
    handleClick: PropTypes.func.isRequired,
}

export default TagName
