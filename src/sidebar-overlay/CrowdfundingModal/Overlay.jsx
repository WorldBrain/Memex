import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import { Overlay } from 'src/common-ui/components'
import styles from './Overlay.css'

class CrowdfundingOverlay extends PureComponent {
    static propTypes = {
        handleClose: PropTypes.func.isRequired,
    }

    render() {
        return (
            <Overlay
                className={styles.background}
                innerClassName={styles.popup}
                onClick={this.props.handleClose}
            >
                <span className={styles.close} onClick={this.props.handleClose}>
                    x
                </span>
                <p className={styles.header}>Ah snap</p>
                <p className={styles.text}>
                    Glad you'd like to have this feature. We too. Unfortunately
                    it's not available yet.
                </p>
                <p className={styles.text}>
                    <b>But</b> you can back it with 10€ and receive 30€ worth of
                    Memex Credits once it launches.
                </p>
                <a className={styles.learnMore}>Learn More</a>
            </Overlay>
        )
    }
}

export default CrowdfundingOverlay
