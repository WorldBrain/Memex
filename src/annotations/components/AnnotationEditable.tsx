import * as React from 'react'
import styled, { ThemeProvider } from 'styled-components'
import ItemBox from '@worldbrain/memex-common/lib/common-ui/components/item-box'
import ItemBoxBottom from '@worldbrain/memex-common/lib/common-ui/components/item-box-bottom'

import * as icons from 'src/common-ui/components/design-library/icons'
import niceTime from 'src/util/nice-time'
import { AnnotationMode } from 'src/sidebar/annotations-sidebar/types'
// import { CrowdfundingBox } from 'src/common-ui/crowdfunding'
import AnnotationView from 'src/annotations/components/AnnotationView'
import { AnnotationFooterEventProps } from 'src/annotations/components/AnnotationFooter'
import AnnotationEdit, {
    AnnotationEditGeneralProps,
    AnnotationEditEventProps,
} from 'src/annotations/components/AnnotationEdit'
import TextTruncated from 'src/annotations/components/parts/TextTruncated'
import { SidebarAnnotationTheme } from '../types'
import {
    AnnotationSharingInfo,
    AnnotationSharingAccess,
} from 'src/content-sharing/ui/types'
import {
    SHARE_BUTTON_ICONS,
    SHARE_BUTTON_LABELS,
    getShareAnnotationBtnState,
    getShareAnnotationBtnAction,
} from '../sharing-utils'

export interface AnnotationEditableGeneralProps {}

export interface AnnotationEditableProps {
    /** Required to decide how to go to an annotation when it's clicked. */
    url: string
    sharingInfo: AnnotationSharingInfo
    sharingAccess: AnnotationSharingAccess
    className?: string
    isActive?: boolean
    isHovered?: boolean
    isClickable?: boolean
    createdWhen: Date
    lastEdited: Date
    body?: string
    comment?: string
    tags: string[]
    isBookmarked?: boolean
    mode: AnnotationMode
    annotationFooterDependencies: AnnotationFooterEventProps
    annotationEditDependencies: AnnotationEditGeneralProps &
        AnnotationEditEventProps
    renderCopyPasterForAnnotation: (id: string) => JSX.Element
    renderShareMenuForAnnotation: (id: string) => JSX.Element
}

export interface AnnotationEditableEventProps {
    onGoToAnnotation: (url: string) => void
    onMouseEnter?: (url: string) => void
    onMouseLeave?: (url: string) => void
}

export type Props = AnnotationEditableGeneralProps &
    AnnotationEditableProps &
    AnnotationEditableEventProps

export default class AnnotationEditable extends React.Component<Props> {
    private annotEditRef = React.createRef<AnnotationEdit>()
    private boxRef: HTMLDivElement = null
    private removeEventListeners?: () => void

    static defaultProps: Partial<Props> = {
        mode: 'default',
    }

    componentDidMount() {
        this.setupEventListeners()
    }

    componentWillUnmount() {
        if (this.boxRef && this.removeEventListeners) {
            this.removeEventListeners()
        }
    }

    focus() {
        this.annotEditRef?.current?.focusOnInputEnd()
    }

    private get sharingData() {
        const sharingProps = {
            ...this.props,
            onShare: this.props.annotationFooterDependencies.onShareClick,
            onUnshare: this.props.annotationFooterDependencies.onShareClick,
        }
        return {
            state: getShareAnnotationBtnState(sharingProps),
            action: getShareAnnotationBtnAction(sharingProps),
        }
    }

    private get creationInfo() {
        // TODO: Figure out why these dates are so unpredictable and fix it
        const handleDateData = (date: string | number | Date): number =>
            typeof date === 'number'
                ? date
                : typeof date === 'string'
                ? new Date(date).getTime()
                : date?.getTime()

        return {
            createdWhen: handleDateData(this.props.createdWhen),
            lastEdited: handleDateData(this.props.lastEdited),
        }
    }

    private get isEdited(): boolean {
        return (
            this.props.lastEdited &&
            this.props.lastEdited !== this.props.createdWhen
        )
    }

    private get theme(): SidebarAnnotationTheme {
        return {
            cursor: this.props.isClickable ? 'pointer' : 'auto',
            hasComment: this.props.comment?.length > 0,
            hasHighlight: this.props.body?.length > 0,
            isActive: this.props.isActive,
            isEditing: this.props.mode === 'edit',
        }
    }

    private setupEventListeners = () => {
        if (this.boxRef) {
            const handleMouseEnter = () =>
                this.props.onMouseEnter?.(this.props.url)
            const handleMouseLeave = () =>
                this.props.onMouseLeave?.(this.props.url)

            this.boxRef.addEventListener('mouseenter', handleMouseEnter)
            this.boxRef.addEventListener('mouseleave', handleMouseLeave)

            this.removeEventListeners = () => {
                this.boxRef.removeEventListener('mouseenter', handleMouseEnter)
                this.boxRef.removeEventListener('mouseleave', handleMouseLeave)
            }
        }
    }

    private setBoxRef = (ref: HTMLDivElement) => {
        this.boxRef = ref
    }

    private getFormattedTimestamp = () =>
        niceTime(this.props.lastEdited ?? this.props.createdWhen)

    private handleGoToAnnotation = () => {
        if (!this.props.isClickable) {
            return
        }

        this.props.onGoToAnnotation(this.props.url)
    }

    private renderHighlightBody() {
        if (!this.props.body) {
            return
        }

        return (
            <HighlightStyled>
                <TextTruncated isHighlight={true} text={this.props.body} />
            </HighlightStyled>
        )
    }

    private renderMainAnnotation() {
        const {
            mode,
            annotationEditDependencies,
            annotationFooterDependencies,
        } = this.props

        if (mode === 'edit') {
            return (
                <AnnotationEdit
                    ref={this.annotEditRef}
                    {...this.props}
                    {...annotationEditDependencies}
                    rows={2}
                />
            )
        }

        return (
            <AnnotationView
                {...this.props}
                theme={this.theme}
                onEditIconClick={annotationFooterDependencies.onEditIconClick}
            />
        )
    }

    private renderShareMenu() {
        return (
            <ShareMenuWrapper>
                {this.props.renderShareMenuForAnnotation(this.props.url)}
            </ShareMenuWrapper>
        )
    }

    private renderCopyPaster() {
        return (
            <CopyPasterWrapper>
                {this.props.renderCopyPasterForAnnotation(this.props.url)}
            </CopyPasterWrapper>
        )
    }

    render() {
        const { annotationFooterDependencies: footerDeps } = this.props

        return (
            <ThemeProvider theme={this.theme}>
                <ItemBox>
                    <AnnotationStyled
                        id={this.props.url} // Focusing on annotation relies on this ID.
                        ref={this.setBoxRef}
                        onClick={this.handleGoToAnnotation}
                    >
                        {this.renderHighlightBody()}
                        {this.renderMainAnnotation()}
                        <FooterStyled>
                            <ItemBoxBottom
                                creationInfo={this.creationInfo}
                                actions={[
                                    {
                                        key: 'delete-note-btn',
                                        image: icons.trash,
                                        onClick: footerDeps.onDeleteIconClick,
                                        tooltipText: 'Delete Note',
                                    },
                                    this.props.body?.length > 0
                                        ? {
                                              key: 'go-to-to-note-btn',
                                              image: icons.goTo,
                                              onClick: () =>
                                                  this.props.onGoToAnnotation(
                                                      this.props.url,
                                                  ),
                                              tooltipText: 'Open in Page',
                                          }
                                        : null,
                                    {
                                        key: 'tag-note-btn',
                                        image:
                                            this.props.tags?.length > 0
                                                ? icons.tagFull
                                                : icons.tagEmpty,
                                        onClick: () =>
                                            this.props.annotationEditDependencies.setTagInputActive(
                                                true,
                                            ),
                                        tooltipText: 'Tag Note',
                                    },
                                    {
                                        key: 'copy-paste-note-btn',
                                        image: icons.copy,
                                        onClick:
                                            footerDeps.onCopyPasterBtnClick,
                                        tooltipText: 'Copy Note',
                                    },
                                    {
                                        key: 'share-note-btn',
                                        image:
                                            SHARE_BUTTON_ICONS[
                                                this.sharingData.state
                                            ],
                                        onClick: footerDeps.onShareClick,
                                        tooltipText:
                                            SHARE_BUTTON_LABELS[
                                                this.sharingData.state
                                            ],
                                        isDisabled: [
                                            'sharing',
                                            'unsharing',
                                        ].includes(this.sharingData.state),
                                    },
                                    {
                                        key: 'bookmark-note-btn',
                                        image: this.props.isBookmarked
                                            ? icons.heartFull
                                            : icons.heartEmpty,
                                        onClick: footerDeps.toggleBookmark,
                                        tooltipText: 'Favorite Note',
                                    },
                                ]}
                            />
                        </FooterStyled>
                        {this.renderCopyPaster()}
                        {this.renderShareMenu()}
                    </AnnotationStyled>
                </ItemBox>
            </ThemeProvider>
        )
    }
}

const ShareMenuWrapper = styled.div`
    position: relative;
`
const CopyPasterWrapper = styled.div`
    position: relative;
    left: 70px;
`

const HighlightStyled = styled.div`
    font-weight: 400;
    font-size: 14px;
    letter-spacing: 0.5px;
    margin: 0 0 5px 0;
    padding: 10px 15px 7px 10px;
    line-height: 20px;
    text-align: left;
    line-break: normal;
`

const FooterStyled = styled.div`
    margin-left: 20px;
    margin-right: 5px;
`

const AnnotationStyled = styled.div`
    color: rgb(54, 54, 46);

    transition: background 120ms ease-in 0s;

    &:hover {
        transition: background 120ms ease-in 0s;
        background-color: rgba(55, 53, 47, 0.03);
    }

    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    font-size: 14px;
    padding: 10px;
    cursor: pointer;
    animation: onload 0.3s cubic-bezier(0.65, 0.05, 0.36, 1);

    cursor: ${({ theme }) => theme.cursor}
        ${({ theme }) =>
            theme.isEditing &&
            `
    background-color: white;
    cursor: default;

    &:hover {
        background-color: white;
    }
    `};
`
