import React from 'react'
import PropTypes from 'prop-types'

const STYLES = {
    root: {
        position: 'absolute',
        width: '50px',
        height: '50px',
        background: 'red',
    },
}

const Tooltip = ({ x, y }) => {
    const styles = { ...STYLES.root, left: x, top: y }
    return <div style={styles}>&nbsp;</div>
}

Tooltip.propTypes = {
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
}

export default Tooltip
