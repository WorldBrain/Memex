import React from 'react'
import PropTypes from 'prop-types'

import styles from './tooltip.css'
import { getExtURL } from '../utils'

const images = {
    share: getExtURL('/img/share.svg'),
    check: getExtURL('/img/green_check.svg'),
    annotate: getExtURL('/img/annotate.svg'),
}

export const InitialComponent = ({ createLink, createAnnotation }) => (
    <div className={styles.createButtons}>
        <div className={styles.annotateButton} onMouseDown={createAnnotation}>
            <img src={images.annotate} />
        </div>
        <div className={styles.linkButton} onMouseDown={createLink}>
            <img src={images.share} />
        </div>
    </div>
)

InitialComponent.propTypes = {
    createLink: PropTypes.func.isRequired,
    createAnnotation: PropTypes.func.isRequired,
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
                Highlight link copied to clipboard
            </p>
            <p className={styles.greyText}>
                Everyone opening it can see this quote
            </p>
        </div>
    </div>
)

export const DoneComponent = () => (
    <div className={styles.doneComponent}>
        <img className={styles.check} src={images.check} />
    </div>
)

export const ErrorComponent = () => (
    <div className={styles.errorMessage}>Error</div>
)
