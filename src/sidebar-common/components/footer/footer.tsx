import * as React from 'react'

const styles = require('./footer.css')

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
        <div>
            <span
                className={actionBtnClassName}
                onClick={e => {
                    e.stopPropagation()
                    actionBtnClickHandler()
                }}
            >
                {actionBtnText}
            </span>
            <span
                className={cancelBtnClassName}
                onClick={e => {
                    e.stopPropagation()
                    cancelBtnClickHandler()
                }}
            >
                Cancel
            </span>
        </div>
    </div>
)

export default Footer
