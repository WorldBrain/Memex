import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { getExtURL } from '../utils'
import { INFO_URL } from '../constants'
import styles from './tooltip.css'

// const cssClasses = {
//     pristine: 'stateInitial',
//     running: 'stateCreatingLink',
//     done: 'stateCreatedLink',
//     error: 'stateLinkError',
//     copied: 'stateLinkCopied',
// }

const images = {
    logo: getExtURL('/img/worldbrain-logo-narrow.png'),
    logoWhite: getExtURL('/img/icon_white.svg'),
    info: getExtURL('/img/info.svg'),
    cross: getExtURL('/img/cross.svg'),
    settings: getExtURL('/img/settings.svg'),
}

const deriveTooltipClass = description =>
    classNames(styles.tooltip, {
        [styles.expanded]: description.length,
    })

const Tooltip = ({
    x,
    y,
    state,
    tooltipComponent,
    closeTooltip,
    openSettings,
    description,
    setDescription,
    removeDescription,
}) => (
    <div
        className={deriveTooltipClass(description)}
        style={{ left: x, top: y }}
        id="memex-tooltip"
    >
        {tooltipComponent}

        <span className={styles.buttons}>
            <a
                onClick={closeTooltip}
                className={styles.smallButton}
                onMouseEnter={setDescription('Close tooltip for now')}
                onMouseLeave={removeDescription}
            >
                <img className={styles.imgCross} src={images.cross} />
            </a>
            <a
                onClick={openSettings}
                className={styles.smallButton}
                onMouseEnter={setDescription('Memex settings')}
                onMouseLeave={removeDescription}
            >
                <img className={styles.imgSettings} src={images.settings} />
            </a>
            <a href={INFO_URL} className={styles.smallButton}>
                <img className={styles.imgInfo} src={images.info} />
            </a>
        </span>

        {description && (
            <div className={styles.descriptionContainer}>{description}</div>
        )}
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
    setDescription: PropTypes.func.isRequired,
    removeDescription: PropTypes.func.isRequired,
}

export default Tooltip
