import React from 'react'
import PropTypes from 'prop-types'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import styles from './tooltip.css'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import browser from 'webextension-polyfill'

const highlighter = browser.runtime.getURL('/img/highlighterSmall.svg')
const annotations = browser.runtime.getURL('/img/comment_empty.svg')
const close = browser.runtime.getURL('/img/close.svg')

const CreateButtons = styled.div`
    display: flex;
    grid-gap: 6px;
    align-items: center;
    justify-content: center;
    padding: 0 8px;
`

const ButtonDiv = styled.button`
    height: fit-content;
    width: fit-content;
    outline: none;
    border: none;
    background: none;
    cursor: pointer;
    padding: 0px;
`

export const InitialComponent = ({
    createLink,
    createHighlight,
    createAnnotation,
    closeTooltip,
    state,
}) => (
    <CreateButtons>
        <ButtonDiv onClick={createHighlight}>
            <ButtonTooltip
                tooltipText={
                    <span>
                        <strong>Highlight</strong>
                        <br />+ shift to share
                    </span>
                }
                position="bottomHighlighter"
            >
                <Icon
                    filePath={highlighter}
                    heightAndWidth="14px"
                    padding="5px"
                    color={'darkerIconColor'}
                />
            </ButtonTooltip>
        </ButtonDiv>
        <ButtonDiv onClick={createAnnotation}>
            <ButtonTooltip
                tooltipText={
                    <span>
                        <strong>Annotate</strong>
                        <br />+ shift to share
                    </span>
                }
                position="bottomHighlighter"
            >
                <Icon
                    filePath={annotations}
                    heightAndWidth="16px"
                    color={'darkerIconColor'}
                />
            </ButtonTooltip>
        </ButtonDiv>
        {/* {createLink && (
            <ButtonTooltip
                tooltipText="Create Link to Highlight"
                position="bottomHighlighter"
            >
                <div className={styles.button} onClick={createLink}>
                    <img src={share} className={styles.buttonImg} />
                </div>
            </ButtonTooltip>
        )} */}
        <ButtonDiv onClick={closeTooltip}>
            <ButtonTooltip
                tooltipText={
                    <span>
                        <strong>Close Highlighter</strong>
                        <br />
                        Disable in Settings
                    </span>
                }
                position="bottomHighlighter"
            >
                <Icon
                    filePath={close}
                    heightAndWidth="12px"
                    padding={'6px'}
                    onClick={closeTooltip}
                    color={'darkerIconColor'}
                />
            </ButtonTooltip>
        </ButtonDiv>
    </CreateButtons>
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
