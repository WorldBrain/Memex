import React, { HTMLProps } from 'react'
import classNames from 'classnames'

const styles = require('./Button.css')

export interface Props extends HTMLProps<HTMLButtonElement> {
    children: React.ReactChild
    btnClass?: string
    itemClass?: string
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
