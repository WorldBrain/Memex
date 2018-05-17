import React from 'react'
import styles from './tooltip.css'

import { getExtURL } from '../utils'

const images = {
    logo: getExtURL('/img/worldbrain-logo-narrow.png'),
    link: getExtURL('/img/link.svg'),
    iconWhite: getExtURL('/img/icon_white.svg'),
    check: getExtURL('/img/check.svg'),
}

export const initialComponent = (
    <div className={styles.createLinkButton}>
        <div className={styles.icon}>
            <img src={images.logo} />
        </div>
        <div className={styles.headingOwnlinks}>
            Create own links on every website
        </div>
        <div className={styles.tooltipDivider} />
        <div className={styles.headingLink}>
            <img src={images.link} />
            <span>Create Link to Highlight</span>
        </div>
    </div>
)

export const creatingLinkComponent = (
    <div className={styles.progressIndicator}>Creating link...</div>
)

export const createdLinkComponent = (
    <div className={styles.createdMessage}>
        <div className={styles.icon}>
            <img src={images.iconWhite} />
        </div>
        <a href="#" target="_blank" className={styles.url}>
            LINK
        </a>
        <br />
        <div className={styles.clickToCopy}>Click to copy</div>
    </div>
)

export const copiedComponent = (
    <div className={styles.copiedMessage}>
        <div className={styles.icon}>
            <img src={images.iconWhite} />
        </div>
        <img className={styles.check} src={images.check} />
        <span className={styles.copiedText}>Link copied to clipboard</span>
    </div>
)

export const errorComponent = <div className={styles.errorMessage}>Error</div>
