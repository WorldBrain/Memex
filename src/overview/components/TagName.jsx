import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import localStyles from './TagName.css'

const getTagClass = tagnm =>
    classNames(localStyles.tagname, {
        [localStyles.notExpanded]: !(tagnm[0] === '+'),
    })

const TagName = ({ tagnm, handleClick, pageId }) => (
    <span
        className={getTagClass(tagnm)}
        onClick={e => handleClick(tagnm[0] === '+' ? pageId : tagnm)(e)}
    >
        {tagnm}
    </span>
)

TagName.propTypes = {
    tagnm: PropTypes.string.isRequired,
    handleClick: PropTypes.func.isRequired,
    pageId: PropTypes.string.isRequired,
}

export default TagName
