import React, { MouseEventHandler } from 'react'
import cx from 'classnames'
import { TooltipBox } from '@worldbrain/memex-common/ts/common-ui/components/tooltip-box'

export interface Props {
    tooltipText: string
    onClick: MouseEventHandler<HTMLButtonElement>
    imgSrc: string
    className?: string
    refHandler?: (el: HTMLElement) => void
    permanent?: boolean
}

const ResultItemActionBtn: React.SFC<Props> = (props) => (
    <TooltipBox
        placement={'bottom'}
        tooltipText={props.tooltipText}
        getPortalRoot={null}
    >
        <button
            className={props.permanent ? 'permanentButton' : 'button'}
            onClick={props.onClick}
            ref={props.refHandler}
        >
            <img src={props.imgSrc} className={cx('img', props.className)} />
        </button>
    </TooltipBox>
)

export default ResultItemActionBtn
