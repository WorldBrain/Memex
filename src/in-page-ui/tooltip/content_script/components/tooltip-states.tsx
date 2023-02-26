import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import KeyboardShortcuts from '@worldbrain/memex-common/lib/common-ui/components/keyboard-shortcuts'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'

const CreateButtons = styled.div`
    display: flex;
    grid-gap: 6px;
    align-items: center;
    justify-content: center;
    padding: 0 8px;
    height: 34px;
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
    flex-direction: row;
    grid-gap: 5px;
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 14px;
`

const AnnotationTooltipText = styled.span`
    font-size: 12px;
    font-family: 'Satoshi', sans-serif;
    font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on,
        'liga' off;
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
    color: ${(props) => props.theme.colors.white};
`

export const InitialComponent = ({
    createHighlight,
    createAnnotation,
    addtoSpace,
    openAIinterface,
    closeTooltip,
    keyboardShortCuts,
}) => (
    <CreateButtons className="noDrag">
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
        <TooltipBox
            tooltipText={
                <AnnotationTooltipText>
                    <TopSection>
                        <strong>Explain & Summarise</strong>
                    </TopSection>
                    <SubSection>
                        <KeyboardShortcuts
                            size={'small'}
                            keys={keyboardShortCuts['openToolTipInAIMode']}
                        />
                    </SubSection>
                </AnnotationTooltipText>
            }
            placement="bottom"
        >
            <PrimaryAction
                label="Explain"
                icon={'stars'}
                onClick={openAIinterface}
                size="small"
                type="forth"
                iconColor="greyScale6"
                iconSize="18px"
                fontSize="12px"
                padding="0px 8px 0 4px"
            />
        </TooltipBox>
        <ButtonDiv onClick={closeTooltip}>
            <TooltipBox
                tooltipText={
                    <AnnotationTooltipText>
                        <TopSection>
                            <strong>Hide Tooltip</strong>
                        </TopSection>
                        <SubSection>
                            <KeyboardShortcuts
                                size="small"
                                optional={'shift'}
                            />{' '}
                            -click to disable
                        </SubSection>
                    </AnnotationTooltipText>
                }
                placement="bottom"
            >
                <Icon
                    filePath={'removeX'}
                    heightAndWidth="16px"
                    onClick={closeTooltip}
                    color={'greyScale4'}
                />
            </TooltipBox>
        </ButtonDiv>
    </CreateButtons>
)

InitialComponent.propTypes = {
    createHighlight: PropTypes.func.isRequired,
    createAnnotation: PropTypes.func.isRequired,
    closeTooltip: PropTypes.func.isRequired,
    openAIinterface: PropTypes.func.isRequired,
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
