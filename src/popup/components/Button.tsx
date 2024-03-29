import React, { HTMLProps } from 'react'
import classNames from 'classnames'

const styles = require('./Button.css')

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
                className={classNames(
                    styles.item,
                    styles.itemBtn,
                    this.props.itemClass,
                    {
                        [styles.disabled]: this.props.disabled,
                    },
                )}
                {...btnProps}
            >
                <div
                    className={classNames(
                        styles.customIcon,
                        this.props.btnClass,
                    )}
                />
                {children}
            </button>
        )
    }
}

export default Button
