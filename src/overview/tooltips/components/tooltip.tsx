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
    nextTooltip?: () => void
    previousTooltip?: () => void
}

const tooltip: SFC<Props> = ({
    children,
    position,
    closeTooltip,
    previousTooltip,
    nextTooltip,
}) => (
    <div className={styles.container} style={position}>
        <div className={styles.navigationBox}>
            <span className={styles.close} onClick={closeTooltip}>
                X
            </span>
            {previousTooltip ? (
                <span className={styles.prev} onClick={previousTooltip}>
                    {'<'}
                </span>
            ) : null}
            {nextTooltip ? (
                <span className={styles.next} onClick={nextTooltip}>
                    {'>'}
                </span>
            ) : null}
        </div>
        <div>{children}</div>
    </div>
)

export default tooltip
