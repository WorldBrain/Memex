import React from 'react'
import PropTypes from 'prop-types'
import ButtonTooltip from '../../common-ui/components/button-tooltip'
import styles from './tooltip.css'

export const InitialComponent = ({
    createLink,
    createHighlight,
    createAnnotation,
}) => (
    <div className={styles.createButtons}>
        <ButtonTooltip tooltipText="Highlight (N)" position="bottom">
            <div onMouseDown={createHighlight}>
                <span className={styles.highlightIcon} />
            </div>
        </ButtonTooltip>

        <ButtonTooltip tooltipText="Annotate (A)" position="bottom">
            <div onMouseDown={createAnnotation}>
                <span
                    data-annotation="annotationIcon"
                    className={styles.annotateIcon}
                />
            </div>
        </ButtonTooltip>

        <ButtonTooltip
            tooltipText="Create Link to Highlight (L)"
            position="bottom"
        >
            <div className={styles.linkButton} onMouseDown={createLink}>
                <span className={styles.shareIcon} />
            </div>
        </ButtonTooltip>
    </div>
)

InitialComponent.propTypes = {
    createLink: PropTypes.func.isRequired,
    createHighlight: PropTypes.func.isRequired,
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
