import React, { HTMLProps } from 'react'
import classNames from 'classnames'

const styles = require('./Button.css')

// todo: Find out why unselectable produces type errors if left in
export interface Props
    extends Omit<HTMLProps<HTMLButtonElement>, 'unselectable'> {
    children?: React.ReactNode
    btnClass?: string
    itemClass?: string
    extraClass?: string
}

class Button extends React.PureComponent<Props> {
    render() {
        const { itemClass, btnClass, children, ...btnProps } = this.props
        return (
            <button
                className={classNames(
                    styles.item,
                    styles.itemBtn,
                    this.props.itemClass,
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
