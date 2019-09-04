import React, { HTMLProps } from 'react'
import classNames from 'classnames'

const styles = require('./Button.css')

class Button extends React.PureComponent<Props> {
    render() {
        return <button className={styles.CTA}>{children}</button>
    }
}

export default Button
