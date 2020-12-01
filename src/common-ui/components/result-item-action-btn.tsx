import React, { MouseEventHandler } from 'react'
import cx from 'classnames'

import ButtonTooltip from './button-tooltip'

const styles = require('./result-item.css')

export interface Props {
    tooltipText: string
    tooltipPosition?: string
    onClick: MouseEventHandler<HTMLButtonElement>
    imgSrc: string
    className?: string
    refHandler?: (el: HTMLElement) => void
    permanent?: boolean
}

const ResultItemActionBtn: React.SFC<Props> = (props) => (
    <ButtonTooltip
        position={props.tooltipPosition || 'bottom'}
        tooltipText={props.tooltipText}
    >
        <button
            className={props.permanent ? styles.permanentButton : styles.button}
            onClick={props.onClick}
            ref={props.refHandler}
        >
            <img
                src={props.imgSrc}
                className={cx(styles.img, props.className)}
            />
        </button>
    </ButtonTooltip>
)

export default ResultItemActionBtn
