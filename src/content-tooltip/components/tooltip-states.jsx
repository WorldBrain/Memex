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
        <ButtonTooltip tooltipText="Highlight (N)" position="bottom">
            <div className={styles.button} onMouseDown={createHighlight}>
                <img src={highlighter} />
            </div>
        </ButtonTooltip>
        <ButtonTooltip tooltipText="Annotate (A)" position="bottom">
            <div className={styles.button} onMouseDown={createAnnotation}>
                <img src={annotations}/>
            </div>
        </ButtonTooltip>
        <ButtonTooltip
            tooltipText="Create Link to Highlight (L)"
            position="bottom"
        >
            <div className={styles.button} onMouseDown={createLink}>
                <img src={share}/>
            </div>
        </ButtonTooltip>
        <ButtonTooltip
            tooltipText="Close. Disable in Toolbar (R)"
            position="bottom"
            >
            <div
                onClick={closeTooltip} 
                className={classNames(styles.button, {
                [styles.noShow] : state === 'running',
                [styles.noShow] : state === 'copied',
            })}>
                <img src={close}/>
            </div>
        </ButtonTooltip>
    </div>
)

InitialComponent.propTypes = {
    createLink: PropTypes.func.isRequired,
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
