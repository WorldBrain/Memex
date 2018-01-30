import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import { Overlay } from 'src/common-ui/components'
import styles from './Onboarding.css'

class OnboardingOverlay extends PureComponent {
    static propTypes = {
        children: PropTypes.node.isRequired,
    }

    render() {
        const { children, ...props } = this.props

        return (
            <Overlay innerClassName={styles.popup} {...props}>
                {this.props.children}
            </Overlay>
        )
    }
}

export default OnboardingOverlay
