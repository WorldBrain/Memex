import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import { Overlay } from 'src/common-ui/components'
import styles from './Onboarding.css'

class OnboardingOverlay extends PureComponent {
    static propTypes = {
        children: PropTypes.node.isRequired,
        onClose: PropTypes.func.isRequired,
        showCloseBtn: PropTypes.bool.isRequired,
    }

    render() {
        const { children, onClose, showCloseBtn, ...props } = this.props

        return (
            <Overlay innerClassName={styles.popup} {...props}>
                {showCloseBtn && (
                    <button
                        className={styles.closeBtn}
                        onClick={onClose}
                        type="button"
                    >
                        ×
                    </button>
                )}
                {this.props.children}
            </Overlay>
        )
    }
}

export default OnboardingOverlay
