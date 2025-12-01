import React, { HTMLProps } from 'react'
import classNames from 'classnames'

export interface Props extends HTMLProps<HTMLButtonElement> {
    children?: React.ReactNode
    btnClass?: string
    itemClass?: string
    extraClass?: string
    disabled?: boolean
}

class Button extends React.PureComponent<Props> {
    render() {
        const { itemClass, btnClass, children, ...btnProps } = this.props
        return (
            // @ts-ignore
            <button
                className={classNames(this.props.itemClass, {
                    disabled: this.props.disabled,
                })}
                {...btnProps}
            >
                <div className={classNames(this.props.btnClass)} />
                {children}
            </button>
        )
    }
}

export default Button
