import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

const OptIn = (props) => (
    <div className={optInContainer(props.fromSearch)}>
        {props.children}
        <div className={optInTextContainer(props.fromSearch)}>
            <p className={optIn(props.fromSearch)}>{props.label}</p>
        </div>
    </div>
)

OptIn.propTypes = {
    children: PropTypes.node.isRequired,
    label: PropTypes.string.isRequired,
    fromSearch: PropTypes.bool,
}

export default OptIn
