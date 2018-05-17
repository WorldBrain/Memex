import React from 'react'
import PropTypes from 'prop-types'

import styles from './tooltip.css'
import { getExtURL } from '../utils'

const images = {
    logo: getExtURL('/img/worldbrain-logo-narrow.png'),
    link: getExtURL('/img/link.svg'),
    iconWhite: getExtURL('/img/icon_white.svg'),
    check: getExtURL('/img/check.svg'),
}

export const InitialComponent = ({ createLink }) => (
    <div className={styles.createLinkButton}>
        <div className={styles.icon}>
            <img src={images.logo} />
        </div>
        <div className={styles.headingOwnlinks}>
            Create own links on every website
        </div>
        <div className={styles.tooltipDivider} />
        <div className={styles.headingLink} onClick={createLink}>
            <img src={images.link} />
            <span>Create Link to Highlight</span>
        </div>
    </div>
)

InitialComponent.propTypes = {
    createLink: PropTypes.func.isRequired,
}

export const CreatingLinkComponent = () => (
    <div className={styles.progressIndicator}>
        <div className={styles.icon}>
            <img src={images.iconWhite} />
        </div>
        <div className={styles.ldsEllipsis}>
            <div />
            <div />
            <div />
            <div />
        </div>
    </div>
)

export const CreatedLinkComponent = ({ link, copyFunc }) => (
    <div className={styles.createdMessage}>
        <div className={styles.icon}>
            <img src={images.iconWhite} />
        </div>
        <a href="" onClick={copyFunc} target="_blank" className={styles.url}>
            {link}
        </a>
        <br />
        <div className={styles.clickToCopy}>Click to copy</div>
    </div>
)

CreatedLinkComponent.propTypes = {
    link: PropTypes.string.isRequired,
    copyFunc: PropTypes.func.isRequired,
}

export const CopiedComponent = () => (
    <div className={styles.copiedMessage}>
        <div className={styles.icon}>
            <img src={images.iconWhite} />
        </div>
        <img className={styles.check} src={images.check} />
        <span className={styles.copiedText}>Link copied to clipboard</span>
    </div>
)

export const ErrorComponent = () => (
    <div className={styles.errorMessage}>Error</div>
)
