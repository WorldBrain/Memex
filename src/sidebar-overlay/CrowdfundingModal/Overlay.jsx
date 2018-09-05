import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import { remoteFunction } from '../../util/webextensionRPC'

import { Overlay } from 'src/common-ui/components'
import styles from './Overlay.css'

class CrowdfundingOverlay extends PureComponent {
    static propTypes = {
        handleClose: PropTypes.func.isRequired,
    }

    openNewLink = () => async () => {
        await remoteFunction('processEvent')({
            type: 'learnMoreCrowdFunding',
        })

        window.open(
            'https://worldbrain.io/product/collaborative-annotations/',
            '_blank',
        )
    }

    render() {
        return (
            <Overlay
                className={styles.background}
                innerClassName={styles.popup}
                onClick={this.props.handleClose}
            >
                <span
                    className={styles.close}
                    onClick={this.props.handleClose}
                />
                <p className={styles.header}>Fund the future!</p>
                <p className={styles.bolderText}>
                    Unfortunately you can't share <br /> and discuss annotations
                    yet.
                </p>
                <p className={styles.text}>
                    Support the development with 10€ and <br />
                    <b>get back 30€</b> worth of Memex Premium Credits.
                </p>
                <a className={styles.learnMore} onClick={this.openNewLink()}>
                    LEARN MORE
                </a>
            </Overlay>
        )
    }
}

export default CrowdfundingOverlay
