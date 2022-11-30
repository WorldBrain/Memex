import React from 'react'
import PropTypes from 'prop-types'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'

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
    height: 24px;
    display: flex;
    align-items: center;
`

const AnnotationTooltipText = styled.span`
    font-size: 12px;
    font-family: 'Satoshi', sans-serif;
    font-style: unset;
    letter-spacing: 0.3px;
`

export const InitialComponent = ({
    createHighlight,
    createAnnotation,
    addtoSpace,
    closeTooltip,
    state,
}) => (
    <CreateButtons>
        <ButtonDiv onClick={createHighlight}>
            <ButtonTooltip
                tooltipText={
                    <AnnotationTooltipText>
                        <strong>Highlight</strong>
                        <br />+ shift to share
                    </AnnotationTooltipText>
                }
                position="bottomHighlighter"
            >
                <Icon
                    filePath={'highlight'}
                    heightAndWidth="18px"
                    color={'greyScale9'}
                />
            </ButtonTooltip>
        </ButtonDiv>
        <ButtonDiv onClick={createAnnotation}>
            <ButtonTooltip
                tooltipText={
                    <AnnotationTooltipText>
                        <strong>Annotate</strong>
                        <br />+ shift to share
                    </AnnotationTooltipText>
                }
                position="bottomHighlighter"
            >
                <Icon
                    filePath={'commentAdd'}
                    heightAndWidth="18px"
                    color={'greyScale9'}
                />
            </ButtonTooltip>
        </ButtonDiv>
        <ButtonDiv onClick={addtoSpace}>
            <ButtonTooltip
                tooltipText={
                    <AnnotationTooltipText>
                        <strong>Add Highlight to Space</strong>
                    </AnnotationTooltipText>
                }
                position="bottomHighlighter"
            >
                <Icon
                    filePath={icons.collectionsEmpty}
                    heightAndWidth="18px"
                    color={'greyScale9'}
                />
            </ButtonTooltip>
        </ButtonDiv>
        <ButtonDiv onClick={closeTooltip}>
            <ButtonTooltip
                tooltipText={
                    <AnnotationTooltipText>
                        <strong>Close Highlighter</strong>
                        <br />
                        Disable in Settings
                    </AnnotationTooltipText>
                }
                position="bottomHighlighter"
            >
                <Icon
                    filePath={'removeX'}
                    heightAndWidth="16px"
                    onClick={closeTooltip}
                    color={'darkerIconColor'}
                />
            </ButtonTooltip>
        </ButtonDiv>
    </CreateButtons>
)

InitialComponent.propTypes = {
    createHighlight: PropTypes.func.isRequired,
    createAnnotation: PropTypes.func.isRequired,
    closeTooltip: PropTypes.func.isRequired,
    state: PropTypes.string,
}

// export const CreatingLinkComponent = () => (
//     <div className={styles.progressIndicator}>
//         <div className={styles.ldsEllipsis}>
//             <div />
//             <div />
//             <div />
//             <div />
//         </div>
//     </div>
// )

// export const CopiedComponent = () => (
//     <div className={styles.copiedMessage}>
//         <span className={styles.check} />
//         <div className={styles.copiedTextContainer}>
//             <span className={styles.greenText}>
//                 Highlight link copied to clipboard
//             </span>
//             <span className={styles.greyText}>
//                 Everyone opening it can see this quote
//             </span>
//         </div>
//     </div>
// )

// export const DoneComponent = () => (
//     <div className={styles.doneComponent}>
//         <span className={styles.check} />
//     </div>
// )

// export const ErrorComponent = () => (
//     <div className={styles.errorMessage}>Error</div>
// )
