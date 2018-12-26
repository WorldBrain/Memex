import React, { SFC } from 'react'

const styles = require('./tooltip.css')

export interface Position {
    top: number | string
    left: number | string
}
export interface Props {
    children: React.ReactChild
    position: Position
    closeTooltip: () => void
}

const tooltip: SFC<Props> = ({ children, position, closeTooltip }) => (
    <div className={styles.container} style={position}>
        <span className={styles.close} onClick={closeTooltip}>
            X
        </span>
        {children}
    </div>
)

export default tooltip
