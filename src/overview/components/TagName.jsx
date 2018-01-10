import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import localStyles from './TagName.css'

const getTagClass = tagnm =>
    classNames(localStyles.tagname, {
        [localStyles.notExpanded]: !(tagnm === '+1'),
    })

const TagName = ({ tagnm }) => (
    <span className={getTagClass(tagnm)}>{tagnm}</span>
)

TagName.propTypes = {
    tagnm: PropTypes.string.isRequired,
}

export default TagName
