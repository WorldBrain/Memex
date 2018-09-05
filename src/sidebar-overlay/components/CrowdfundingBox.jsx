import React from 'react'
import PropTypes from 'prop-types'

import { remoteFunction } from '../../util/webextensionRPC'

import styles from './CrowdfundingBox.css'

const openNewLink = () => async () => {
    await remoteFunction('processEvent')({
        type: 'learnMoreCrowdFunding',
    })

    window.open(
        'https://worldbrain.io/product/collaborative-annotations/',
        '_blank',
    )
}

const CrowdfundingBox = props => (
    <div className={styles.container}>
        <p className={styles.header}>Fund the future!</p>
        <p className={styles.boldText}>
            Unfortunately you can't share <br /> and discuss annotations yet.
        </p>
        <p className={styles.text}>
            Support the development with 10€ and{' '}
            <i>
                <b>get back 30€</b>
            </i>{' '}
            worth in Memex Premium Credits.
        </p>
        <a className={styles.learnMore} onClick={openNewLink()}>
            LEARN MORE
        </a>
        <div onClick={props.onClose} className={styles.closeDiv}>
            Close Notification
        </div>
    </div>
)

CrowdfundingBox.propTypes = {
    onClose: PropTypes.func.isRequired,
}

export default CrowdfundingBox
