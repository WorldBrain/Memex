import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { getExtURL } from '../utils'
import { INFO_URL } from '../constants'
import styles from './tooltip.css'

const cssClasses = {
    pristine: 'stateInitial',
    running: 'stateCreatingLink',
    done: 'stateCreatedLink',
    error: 'stateLinkError',
    copied: 'stateLinkCopied',
}

const images = {
    logo: getExtURL('/img/worldbrain-logo-narrow.png'),
    logoWhite: getExtURL('/img/icon_white.svg'),
    info: getExtURL('/img/info.svg'),
    cross: getExtURL('/img/cross.svg'),
    settings: getExtURL('/img/settings.svg'),
}

const Tooltip = ({
    x,
    y,
    state,
    tooltipComponent,
    closeTooltip,
    openSettings,
    description,
}) => (
    <div
        className={classNames(styles.tooltip, styles[cssClasses[state]])}
        style={{ left: x, top: y }}
        id="memex-tooltip"
    >
        {tooltipComponent}

        <span className={styles.buttons}>
            <a onClick={closeTooltip} className={styles.smallButton}>
                <img className={styles.imgCross} src={images.cross} />
            </a>
            <a onClick={openSettings} className={styles.smallButton}>
                <img className={styles.imgSettings} src={images.settings} />
            </a>
            <a href={INFO_URL} className={styles.smallButton}>
                <img className={styles.imgInfo} src={images.info} />
            </a>
        </span>

        <div className={styles.descriptionContainer}>{description}</div>
    </div>
)

Tooltip.propTypes = {
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    state: PropTypes.string.isRequired,
    tooltipComponent: PropTypes.element.isRequired,
    closeTooltip: PropTypes.func.isRequired,
    openSettings: PropTypes.func.isRequired,
    description: PropTypes.string.isRequired,
}

export default Tooltip
