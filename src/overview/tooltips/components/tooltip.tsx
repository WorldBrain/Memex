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
    previousTooltip?: () => void
}

const tooltip: SFC<Props> = ({
    children,
    position,
    closeTooltip,
    previousTooltip,
}) => (
    <div className={styles.container} style={position}>
        <span className={styles.close} onClick={closeTooltip}>
            X
        </span>
        {previousTooltip ? (
            <span className={styles.prev} onClick={previousTooltip}>
                {'<'}
            </span>
        ) : null}
        {children}
    </div>
)

export default tooltip
