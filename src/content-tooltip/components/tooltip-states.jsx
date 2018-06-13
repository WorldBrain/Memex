import React from 'react'
import PropTypes from 'prop-types'

import styles from './tooltip.css'
import { getExtURL } from '../utils'

const images = {
    share: getExtURL('/img/share.svg'),
    check: getExtURL('/img/green_check.svg'),
}

export const InitialComponent = ({ createLink }) => (
    <div className={styles.createLinkButton} onMouseDown={createLink}>
        <img className={styles.createLinkImg} src={images.share} />
    </div>
)

InitialComponent.propTypes = {
    createLink: PropTypes.func.isRequired,
}

export const CreatingLinkComponent = () => (
    <div className={styles.progressIndicator}>
        <div className={styles.ldsEllipsis}>
            <div />
            <div />
            <div />
            <div />
        </div>
    </div>
)

export const CopiedComponent = () => (
    <div className={styles.copiedMessage}>
        <img className={styles.check} src={images.check} />
        <div className={styles.copiedTextContainer}>
            <p className={styles.greenText}>
                Link to highlight copied to clipboard
            </p>
            <p className={styles.greyText}>
                Everyone opening it can see this quote
            </p>
        </div>
    </div>
)

export const ErrorComponent = () => (
    <div className={styles.errorMessage}>Error</div>
)
