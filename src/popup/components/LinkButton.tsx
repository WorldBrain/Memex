import React, { PureComponent } from 'react'

import OutLink from 'src/common-ui/containers/OutLink'
import Button, { Props as BtnProps } from './Button'

const styles = require('./Button.css')

export interface Props extends BtnProps {
    href: string
}

class LinkButton extends PureComponent<Props> {
    render() {
        const { href, ref, ...btnProps } = this.props

        return (
            <OutLink className={styles.link} to={href} tabIndex="-1">
                <Button {...btnProps} />
            </OutLink>
        )
    }
}

export default LinkButton
