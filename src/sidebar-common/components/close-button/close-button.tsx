import React from 'react'
import cx from 'classnames'

import { ClickHandler } from '../../types'

const styles = require('./close-button.css')

interface Props {
    isOverview?: boolean
    clickHandler: ClickHandler<HTMLDivElement>
    title: string
}

// TODO: Remove `isOverview` prop. Instead pass a `styles` prop for positioning.

/* tslint:disable-next-line variable-name */
const CloseButton = ({ isOverview = false, clickHandler, title }: Props) => (
    <div
        className={cx(styles.close, {
            [styles.overview]: isOverview,
        })}
        onClick={clickHandler}
        title={title}
    >
        <span className={styles.closeIcon} />
    </div>
)

export default CloseButton
