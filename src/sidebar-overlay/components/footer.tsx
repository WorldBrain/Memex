import * as React from 'react'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'

const styles = require('./footer.css')

const MOD_KEY = getKeyName({ key: 'mod' })

interface Props {
    dialogText?: string
    dialogTextClassName?: any
    actionBtnText: string
    actionBtnClassName: any
    cancelBtnClassName: any
    actionBtnClickHandler: () => void
    cancelBtnClickHandler: () => void
}

/* tslint:disable-next-line variable-name */
const Footer = ({
    dialogText,
    dialogTextClassName,
    actionBtnText,
    actionBtnClassName,
    cancelBtnClassName,
    actionBtnClickHandler,
    cancelBtnClickHandler,
}: Props) => (
    <div className={styles.footer}>
        <div>
            {!!dialogText && (
                <span className={dialogTextClassName || ''}>{dialogText}</span>
            )}
        </div>
        <div className={styles.savecancel}>
            <TooltipBox tooltipText={`${MOD_KEY} + Enter`} placement="top">
                <button
                    className={actionBtnClassName}
                    onClick={(e) => {
                        e.stopPropagation()
                        actionBtnClickHandler()
                    }}
                >
                    {actionBtnText}ss
                </button>
            </TooltipBox>
            <button
                className={cancelBtnClassName}
                onClick={(e) => {
                    e.stopPropagation()
                    cancelBtnClickHandler()
                }}
            >
                Cancel
            </button>
        </div>
    </div>
)

export default Footer
