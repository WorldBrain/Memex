import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import AnimationWrapper from './AnimationWrapper'
import { getExtURL } from '../utils'
import styles from './tooltip.css'

const images = {
    cross: getExtURL('/img/cross_grey.svg'),
    settings: getExtURL('/img/settings_grey.svg'),
    tooltipIcon: getExtURL('/img/tooltipIcon.svg'),
}

const deriveTooltipClass = (state, showCloseMessage) =>
    classNames(styles.tooltip, {
        [styles.statePristine]: state === 'pristine',
        [styles.stateCopied]: state === 'copied',
        [styles.tooltipWithCloseMessage]: showCloseMessage,
    })

const Tooltip = ({
    x,
    y,
    showCloseMessage,
    state,
    tooltipComponent,
    closeTooltip,
    openSettings,
}) => (
    <div
        className={deriveTooltipClass(state, showCloseMessage)}
        style={{ left: x, top: y }}
        id="memex-tooltip"
    >
        {!showCloseMessage && (
            <React.Fragment>
                <AnimationWrapper>{tooltipComponent}</AnimationWrapper>
                {_renderButtons({ closeTooltip, openSettings })}
            </React.Fragment>
        )}

        {showCloseMessage && (
            <React.Fragment>
                <div className={styles.closeMessage}>
                    <div className={styles.titleMessage}>
                        It's your first time closing the Highlighter
                    </div>
                    <div
                        onClick={event =>
                            closeTooltip(event, { disable: true })
                        }
                        className={styles.closeMessageDisableTooltip}
                    >
                        <span>
                            <img
                                src={images.tooltipIcon}
                                className={styles.tooltipIcon}
                            />
                        </span>
                        Disable on all sites
                    </div>
                </div>
                {_renderButtons({ closeTooltip })}
            </React.Fragment>
        )}
    </div>
)

Tooltip.propTypes = {
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    showCloseMessage: PropTypes.bool.isRequired,
    state: PropTypes.string.isRequired,
    tooltipComponent: PropTypes.element.isRequired,
    closeTooltip: PropTypes.func.isRequired,
    openSettings: PropTypes.func.isRequired,
}

export default Tooltip

export function _renderButtons({ closeTooltip, openSettings }) {
    return (
        <span className={styles.buttons}>
            <a onClick={closeTooltip} className={styles.smallButton}>
                <img
                    className={styles.imgCross}
                    src={images.cross}
                    title={
                        'Close once. Disable via Memex icon in the extension toolbar.'
                    }
                />
            </a>
            {openSettings && (
                <a onClick={openSettings} className={styles.smallButton}>
                    <img className={styles.imgSettings} src={images.settings} />
                </a>
            )}
        </span>
    )
}

_renderButtons.propTypes = {
    closeTooltip: PropTypes.func.isRequired,
    openSettings: PropTypes.func,
}
