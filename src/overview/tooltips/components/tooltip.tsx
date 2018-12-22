import React, { SFC } from 'react'

const styles = require('./tooltip.css')

export interface Position {
    top: number | string
    left: number | string
}
export interface Props {
    children: React.ReactChild
    position: Position
}

const tooltip: SFC<Props> = ({ children, position }) => (
    <div className={styles.container} style={position}>
        {children}
    </div>
)

export default tooltip
