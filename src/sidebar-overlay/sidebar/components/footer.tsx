import * as React from 'react'

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
    <React.Fragment>
        {!!dialogText && (
            <span className={dialogTextClassName || ''}>{dialogText}</span>
        )}
        <span className={actionBtnClassName} onClick={actionBtnClickHandler}>
            {actionBtnText}{' '}
        </span>{' '}
        <span className={cancelBtnClassName} onClick={cancelBtnClickHandler}>
            Cancel{' '}
        </span>{' '}
    </React.Fragment>
)

export default Footer
