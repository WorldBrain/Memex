import React from 'react'
import cx from 'classnames'

import { Props as ContainerProps } from './PauseContainer'

const getIconStyles = (isPaused) =>
    cx({
        playIcon: isPaused,
        pauseIcon: !isPaused,
    })

export interface Props extends Pick<
    ContainerProps,
    'togglePause' | 'isPaused'
> {
    children: React.ReactChild
}

export default function PauseButton({
    togglePause,
    isPaused,
    children,
}: Props) {
    return (
        <div onClick={togglePause}>
            <div className={cx(getIconStyles(isPaused))} />
            {children}
        </div>
    )
}
