import React from 'react'
import PropTypes from 'prop-types'

const DoneIcon = props => (
    <svg width={32} height={32} fill="none" {...props}>
        <circle cx={16} cy={16} r={16} fill={props.circlefill} />
        <path
            d="M24 12.546L21.454 10l-7.272 7.273-3.636-3.637L8 16.182l6.182 6.182L24 12.545z"
            fill={props.tickfill}
        />
    </svg>
)

DoneIcon.defaultProps = {
    circlefill: '#5CD9A6',
    tickfill: '#fff',
}

DoneIcon.propTypes = {
    circlefill: PropTypes.string,
    tickfill: PropTypes.tickfill,
}

export default DoneIcon
