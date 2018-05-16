import React from 'react'

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

export default function Tooltip() {
    return <div style={STYLES.root}>&nbsp;</div>
}
