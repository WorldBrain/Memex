import * as React from 'react'
import cx from 'classnames'
import styled from 'styled-components'

import {
    AnnotationSharingInfo,
    AnnotationSharingAccess,
} from 'src/content-sharing/ui/types'
import { AnnotationShareIconRenderer } from 'src/annotations/components/AnnotationShareIconRenderer'
import { LoadingIndicator, ButtonTooltip } from 'src/common-ui/components'
import * as icons from 'src/common-ui/components/design-library/icons'

const styles = require('./default-footer.css')

export interface ShareAnnotationProps {
    sharingInfo?: AnnotationSharingInfo
    sharingAccess: AnnotationSharingAccess
    onShare: React.MouseEventHandler
    onUnshare: React.MouseEventHandler
}

interface Props extends ShareAnnotationProps {
    displayGoToAnnotation: boolean
    isEdited: boolean
    timestamp: string
    hasBookmark: boolean
    handleBookmarkToggle: () => void
    editIconClickHandler: () => void
    trashIconClickHandler: () => void
    copyIconClickHandler?: () => void
    goToAnnotationHandler: (e: React.MouseEvent<HTMLElement>) => void
}

/* tslint:disable-next-line variable-name */
const DefaultFooter = ({
    timestamp,
    isEdited,
    hasBookmark,
    displayGoToAnnotation,
    goToAnnotationHandler,
    editIconClickHandler,
    trashIconClickHandler,
    copyIconClickHandler,
    handleBookmarkToggle,
    ...props
}: Props) => (
    <AnnotationBoxDefaultFooter>
        <TimeStamp className={styles.timestamp}>
            {isEdited && <LastEdit>Last Edit: </LastEdit>}
            {timestamp}
        </TimeStamp>
        <ButtonContainer>
            {copyIconClickHandler && (
                <ButtonTooltip position="bottom" tooltipText="Copy">
                    <IconBox onClick={copyIconClickHandler}>
                        <IconStyled src={icons.copy} />
                    </IconBox>
                </ButtonTooltip>
            )}
            <ButtonTooltip position={'bottom'} tooltipText={'Delete'}>
                <IconBox
                    onClick={(e) => {
                        e.stopPropagation()
                        trashIconClickHandler()
                    }}
                >
                    <IconStyled src={icons.trash} />
                </IconBox>
            </ButtonTooltip>
            {displayGoToAnnotation && (
                <ButtonTooltip position={'bottom'} tooltipText={'Go to Page'}>
                    <IconBox
                        title="Go to annotation"
                        onClick={goToAnnotationHandler}
                    >
                        <IconStyled title="Go to Highlight" src={icons.goTo} />
                    </IconBox>
                </ButtonTooltip>
            )}
            <ButtonTooltip position={'bottom'} tooltipText={'Edit Note'}>
                <IconBox
                    onClick={(e) => {
                        e.stopPropagation()
                        editIconClickHandler()
                    }}
                >
                    <IconStyled src={icons.commentEdit} />
                </IconBox>
            </ButtonTooltip>
            <AnnotationShareIconRenderer
                {...props}
                renderShareIcon={(shareIconProps) => (
                    <ButtonTooltip
                        position={'bottom'}
                        tooltipText={shareIconProps.tooltipText}
                    >
                        <IconBox
                            onClick={shareIconProps.onClickAction}
                            disabled={shareIconProps.isLoading}
                        >
                            <IconStyled
                                src={shareIconProps.imgSrc}
                                className={cx(styles.shareIcon, {
                                    [styles.shareIconDisabled]:
                                        shareIconProps.isDisabled ||
                                        shareIconProps.isLoading,
                                })}
                            />
                        </IconBox>
                    </ButtonTooltip>
                )}
            />
            {/*{hasBookmark ? (
                <ButtonTooltip position={'bottom'} tooltipText={'Un-Bookmark'}>
                    <IconBoxPermanent
                        onClick={(e) => {
                            e.stopPropagation()
                            handleBookmarkToggle()
                        }}
                    >
                        <IconStyled src={icons.heartFull} />
                    </IconBoxPermanent>
                </ButtonTooltip>
            ) : (
                <ButtonTooltip position={'bottom'} tooltipText={'Bookmark'}>
                    <IconBox
                        onClick={(e) => {
                            e.stopPropagation()
                            handleBookmarkToggle()
                        }}
                    >
                        <IconStyled src={icons.heartEmpty} />
                    </IconBox>
                </ButtonTooltip>
            )}
            */}
        </ButtonContainer>
    </AnnotationBoxDefaultFooter>
)

const AnnotationBoxDefaultFooter = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
    height: 30px;
`

const ButtonContainer = styled.div`
    display: flex;
    flex-direction: row;
    z-index: 0;
    display: grid;
    grid-auto-flow: column;
    grid-column-gap: 4px;
`

const IconBox = styled.button<{ disabled?: boolean }>`
    border: none;
    background: none;
    ${(props) => (!props.disabled ? 'cursor: pointer' : '')};
    padding: 4px;
    border-radius: 3px;
    display: flex;
    outline: none;
    align-items: center;
    justify-content: center;
    height: 24px;
    width: 24px;

    ${(props) =>
        !props.disabled
            ? `
            &:hover {
                background-color: #e0e0e0;

                & > img {
                    opacity: 0.6;
                }
            }
            `
            : ''}
`
const IconStyled = styled.img`
    border: none;
    z-index: 2500;
    outline: none;
    border-radius: 3px;
    height: 100%;
    opacity: 0.2;
`

const IconBoxPermanent = styled.button<{ disabled?: boolean }>`
    border: none;
    background: none;
    ${(props) => (!props.disabled ? 'cursor: pointer' : '')};
    padding: 4px;
    border-radius: 3px;
    display: flex;
    outline: none;
    align-items: center;
    justify-content: center;
    height: 24px;
    width: 24px;

    ${(props) =>
        !props.disabled
            ? `
            &:hover {
                background-color: #e0e0e0;
            }

            & > img {
                    opacity: 0.6;
            }
            `
            : ''}
`

const TimeStamp = styled.div`
    margin-right: auto;
    margin-left: 5px;
    font-size: 12px;
    font-weight: 400;
    color: #72727f;
    align-items: center;
    display: flex;
    height: 100%;

    & .lastEdit {
        font-weight: 600;
        color: #72727f;
        margin: 0px;
    }
`

const LastEdit = styled.span`
    margin: 0 5px;
    font-weight: bold;
`

export default DefaultFooter
