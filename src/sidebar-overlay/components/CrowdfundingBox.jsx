import React from 'react'
import PropTypes from 'prop-types'

import styles from './CrowdfundingBox.css'

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
        <a
            className={styles.learnMore}
            href={'https://worldbrain.io/product/collaborative-annotations/'}
            target={'_blank'}
        >
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
