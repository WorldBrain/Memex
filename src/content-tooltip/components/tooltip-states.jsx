import React from 'react'
import PropTypes from 'prop-types'
import ButtonTooltip from '../../common-ui/components/button-tooltip'
import styles from './tooltip.css'
import classNames from 'classnames'
import { browser } from 'webextension-polyfill-ts'

const highlighter = browser.extension.getURL('/img/highlightOn.svg')
const annotations = browser.extension.getURL('/img/comment_add.svg')
const share = browser.extension.getURL('/img/share.svg')
const close = browser.extension.getURL('/img/close.svg')

export const InitialComponent = ({
    createLink,
    createHighlight,
    createAnnotation,
    closeTooltip,
    state,
}) => (
    <div className={styles.createButtons}>
        <div className={styles.button} onClick={createHighlight}>
            <ButtonTooltip tooltipText="Highlight (N)" position="bottom">
                <img src={highlighter} className={styles.buttonImg} />
            </ButtonTooltip>
        </div>

        <div className={styles.button} onClick={createAnnotation}>
            <ButtonTooltip tooltipText="Annotate (A)" position="bottom">
                <img src={annotations} className={styles.buttonImg} />
            </ButtonTooltip>
        </div>
        {createLink && (
            <ButtonTooltip
                tooltipText="Create Link to Highlight (L)"
                position="bottom"
            >
                <div className={styles.button} onClick={createLink}>
                    <img src={share} className={styles.buttonImg} />
                </div>
            </ButtonTooltip>
        )}

        <div
            onClick={closeTooltip}
            className={classNames(styles.button, styles.closeBtn, {
                [styles.noShow]: state === 'running',
                [styles.noShow]: state === 'copied',
            })}
        >
            <ButtonTooltip
                tooltipText="Close. Disable in Toolbar (R)"
                position="bottom"
            >
                <img src={close} className={styles.buttonImg} />
            </ButtonTooltip>
        </div>
    </div>
)

InitialComponent.propTypes = {
    createLink: PropTypes.func,
    createHighlight: PropTypes.func.isRequired,
    createAnnotation: PropTypes.func.isRequired,
    closeTooltip: PropTypes.func.isRequired,
    state: PropTypes.string,
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
        <span className={styles.check} />
        <div className={styles.copiedTextContainer}>
            <span className={styles.greenText}>
                Highlight link copied to clipboard
            </span>
            <span className={styles.greyText}>
                Everyone opening it can see this quote
            </span>
        </div>
    </div>
)

export const DoneComponent = () => (
    <div className={styles.doneComponent}>
        <span className={styles.check} />
    </div>
)

export const ErrorComponent = () => (
    <div className={styles.errorMessage}>Error</div>
)
