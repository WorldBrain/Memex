import React from 'react'
import cx from 'classnames'

import { Props as ContainerProps } from './PauseContainer'

const buttonStyles = require('../../components/Button.css')
const styles = require('./PauseButton.css')

const getIconStyles = isPaused =>
    cx({
        [buttonStyles.customIcon]: true,
        [styles.playIcon]: isPaused,
        [styles.pauseIcon]: !isPaused,
    })

export interface Props
    extends Pick<ContainerProps, 'togglePause' | 'isPaused'> {
    children: React.ReactChild
}

export default function PauseButton({
    togglePause,
    isPaused,
    children,
}: Props) {
    return (
        <div className={cx(buttonStyles.item, buttonStyles.itemDropdown)}>
            <div
                onClick={togglePause}
                className={cx(getIconStyles(isPaused))}
            />
            {children}
        </div>
    )
}
