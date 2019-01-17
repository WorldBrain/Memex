import React from 'react'

import { ClickHandler } from '../types'

const styles = require('./close-button.css')

interface Props {
    clickHandler: ClickHandler<HTMLDivElement>
    title: string
}

/* tslint:disable-next-line variable-name */
const CloseButton = ({ clickHandler, title }: Props) => (
    <div className={styles.close} onClick={clickHandler} title={title}>
        <span className={styles.closeIcon} />
    </div>
)

export default CloseButton
