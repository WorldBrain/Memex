import React, { SFC } from 'react'

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
    <div style={position}>
        <div>
            {previousTooltip ? <span onClick={previousTooltip} /> : null}
            {nextTooltip ? <span onClick={nextTooltip} /> : null}
            <span onClick={closeTooltip} />
        </div>
        <div>{children}</div>
    </div>
)

export default tooltip
