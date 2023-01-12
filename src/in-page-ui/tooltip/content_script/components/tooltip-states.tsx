import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import KeyboardShortcuts from '@worldbrain/memex-common/lib/common-ui/components/keyboard-shortcuts'

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
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    grid-gap: 5px;
`

const SubSection = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
`

const TopSection = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    grid-gap: 5px;
`

export const InitialComponent = ({
    createHighlight,
    createAnnotation,
    addtoSpace,
    closeTooltip,
    state,
    keyboardShortCuts,
}) => (
    <CreateButtons>
        <ButtonDiv onClick={createHighlight}>
            <TooltipBox
                tooltipText={
                    <AnnotationTooltipText>
                        <TopSection>
                            <strong>Highlight</strong>
                            <KeyboardShortcuts
                                size={'small'}
                                keys={keyboardShortCuts['createHighlight']}
                            />
                        </TopSection>
                        <SubSection>
                            <KeyboardShortcuts
                                size="small"
                                optional={'shift'}
                            />{' '}
                            to share
                        </SubSection>
                    </AnnotationTooltipText>
                }
                placement="bottom"
            >
                <Icon
                    filePath={'highlight'}
                    heightAndWidth="18px"
                    color={'greyScale6'}
                />
            </TooltipBox>
        </ButtonDiv>
        <ButtonDiv onClick={createAnnotation}>
            <TooltipBox
                tooltipText={
                    <AnnotationTooltipText>
                        <TopSection>
                            <strong>Add Note</strong>
                            <KeyboardShortcuts
                                size={'small'}
                                keys={keyboardShortCuts['createAnnotation']}
                            />
                        </TopSection>
                        <SubSection>
                            <KeyboardShortcuts
                                size="small"
                                optional={'shift'}
                            />{' '}
                            to share
                        </SubSection>
                    </AnnotationTooltipText>
                }
                placement="bottom"
            >
                <Icon
                    filePath={'commentAdd'}
                    heightAndWidth="18px"
                    color={'greyScale6'}
                />
            </TooltipBox>
        </ButtonDiv>
        <ButtonDiv onClick={addtoSpace}>
            <TooltipBox
                tooltipText={
                    <AnnotationTooltipText>
                        <TopSection>
                            <strong>Add to Space</strong>
                            <KeyboardShortcuts
                                size={'small'}
                                keys={
                                    keyboardShortCuts[
                                        'createAnnotationWithSpace'
                                    ]
                                }
                            />
                        </TopSection>
                        <SubSection>
                            <KeyboardShortcuts
                                size="small"
                                optional={'shift'}
                            />{' '}
                            to share
                        </SubSection>
                    </AnnotationTooltipText>
                }
                placement="bottom"
            >
                <Icon
                    filePath={icons.collectionsEmpty}
                    heightAndWidth="18px"
                    color={'greyScale6'}
                />
            </TooltipBox>
        </ButtonDiv>
        <ButtonDiv onClick={closeTooltip}>
            <TooltipBox
                tooltipText={
                    <AnnotationTooltipText>
                        <strong>Close Highlighter</strong>
                        Disable in Settings
                    </AnnotationTooltipText>
                }
                placement="bottom"
            >
                <Icon
                    filePath={'removeX'}
                    heightAndWidth="16px"
                    onClick={closeTooltip}
                    color={'greyScale3'}
                />
            </TooltipBox>
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
