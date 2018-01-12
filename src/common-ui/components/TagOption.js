import React from 'react'
import PropTypes from 'prop-types'
import localStyles from './TagOption.css'
import classNames from 'classnames'

const getOptionClass = hovered =>
    classNames(localStyles.menuItem, {
        [localStyles.hoveredMenuItem]: hovered,
    })

const TagOption = ({
    data,
    active,
    handleClick,
    newTag,
    setTagInputFocus,
    hovered,
    children,
}) => (
    <div
        className={getOptionClass(hovered)}
        onClick={() => {
            newTag === 1 ? setTagInputFocus(data) : handleClick(data)
        }}
    >
        {children}
        {active && <i className="material-icons">done</i>}
    </div>
)

TagOption.propTypes = {
    data: PropTypes.string.isRequired,
    active: PropTypes.bool.isRequired,
    handleClick: PropTypes.func.isRequired,
    newTag: PropTypes.number.isRequired,
    setTagInputFocus: PropTypes.func.isRequired,
    hovered: PropTypes.bool.isRequired,
    children: PropTypes.object.isRequired,
}

export default TagOption
