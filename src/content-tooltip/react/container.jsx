import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import Tooltip from './tooltip'

export default function Container(props) {
    if (!props.tooltipPosition) {
        return null
    }

    return <Tooltip position={props.tooltipPosition}>test</Tooltip>
}

Container.propTypes = {
    tooltipPosition: PropTypes.shape({
        x: PropTypes.number,
        y: PropTypes.number,
    }),
}
