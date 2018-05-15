import React from 'react'
import ReactDOM from 'react-dom'
import Radium from 'radium'

const STYLES = {
    root: {
        position: 'absolute',
        left: '50px',
        top: '50px',
        width: '50px',
        height: '50px',
        background: 'red',
    },
}

export default Radium(function Tooltip() {
    return <div style={STYLES.root}>&nbsp;</div>
})
