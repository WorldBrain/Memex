import React from 'react'
import PropTypes from 'prop-types'

import styles from './tooltip.css'
import { getExtURL } from '../utils'

const images = {
    link: getExtURL('/img/link.svg'),
    check: getExtURL('/img/check.svg'),
}

export const InitialComponent = ({ createLink }) => (
    <div className={styles.createLinkButton} onMouseDown={createLink}>
        <img className={styles.createLinkImg} src={images.link} />
        <div className={styles.createLinkText}>Create Link</div>
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
        <span className={styles.copiedText}>Link copied to clipboard</span>
        <img className={styles.check} src={images.check} />
    </div>
)

export const ErrorComponent = () => (
    <div className={styles.errorMessage}>Error</div>
)
