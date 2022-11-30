import React, { MouseEventHandler } from 'react'
import cx from 'classnames'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'

const styles = require('./result-item.css')

export interface Props {
    tooltipText: string
    onClick: MouseEventHandler<HTMLButtonElement>
    imgSrc: string
    className?: string
    refHandler?: (el: HTMLElement) => void
    permanent?: boolean
}

const ResultItemActionBtn: React.SFC<Props> = (props) => (
    <TooltipBox placement={'bottom'} tooltipText={props.tooltipText}>
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
    </TooltipBox>
)

export default ResultItemActionBtn
