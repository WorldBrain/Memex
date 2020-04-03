import React from 'react'

import { ClickHandler } from '../types'

const styles = require('./close-button.css')

interface Props {
    clickHandler: ClickHandler<HTMLElement>
    title: string
}

/* tslint:disable-next-line variable-name */
const CloseButton = ({ clickHandler, title }: Props) => (
    <button className={styles.close} onClick={clickHandler} title={title}>
        <span className={styles.closeIcon} />
    </button>
)

export default CloseButton
