import React, { MouseEventHandler } from 'react'
import cx from 'classnames'

import ButtonTooltip from './button-tooltip'

const styles = require('./result-item.css')

export interface Props {
    tooltipText: string
    onClick: MouseEventHandler
    imgSrc: string
    className?: string
    refHandler?: (el: HTMLElement) => void
    permanent?: boolean
}

const ResultItemActionBtn: React.SFC<Props> = props => (
    <ButtonTooltip position="bottom" tooltipText={props.tooltipText}>
        <div
            className={props.permanent ? styles.permanentButton : styles.button}
        >
            <img
                ref={props.refHandler}
                src={props.imgSrc}
                onClick={props.onClick}
                className={cx(styles.img, props.className)}
            />
        </div>
    </ButtonTooltip>
)

export default ResultItemActionBtn
