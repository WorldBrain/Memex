import React, { PureComponent, createRef } from 'react'
import styled, { css } from 'styled-components'
import ItemBox from '@worldbrain/memex-common/lib/common-ui/components/item-box'
import ItemBoxBottom, {
    ItemBoxBottomAction,
} from '@worldbrain/memex-common/lib/common-ui/components/item-box-bottom'

import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import type {
    PageData,
    PageInteractionProps,
    PageResult,
    PagePickerProps,
} from '../types'
import { PageNotesCopyPaster } from 'src/copy-paster'
import CollectionPicker from 'src/custom-lists/ui/CollectionPicker'
import AllNotesShareMenu, {
    Props as ShareMenuProps,
} from 'src/overview/sharing/AllNotesShareMenu'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import ListsSegment from 'src/common-ui/components/result-item-spaces-segment'
import type { ListDetailsGetter } from 'src/annotations/types'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import BlockContent from '@worldbrain/memex-common/lib/common-ui/components/block-content'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { YoutubeService } from '@worldbrain/memex-common/lib/services/youtube'
import type { PageAnnotationsCacheInterface } from 'src/annotations/cache/types'
import { browser } from 'webextension-polyfill-ts'
import { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import { Checkbox } from 'src/common-ui/components'
import CheckboxNotInput from 'src/common-ui/components/CheckboxNotInput'
import { TaskState } from 'ui-logic-core/lib/types'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'

const MemexIcon = browser.runtime.getURL('img/memex-icon.svg')

export interface Props
    extends Omit<PageData, 'lists'>,
        PageResult,
        PageInteractionProps,
        PagePickerProps {
    annotationsCache: PageAnnotationsCacheInterface
    getListDetailsById: ListDetailsGetter
    isSearchFilteredByList: boolean
    filteredbyListID?: number
    youtubeService: YoutubeService
    lists: number[]
    shareMenuProps: Omit<
        ShareMenuProps,
        'annotationsBG' | 'contentSharingBG' | 'customListsBG'
    >
    filterbyList: (listId: number) => void
    analyticsBG: AnalyticsCoreInterface
    index: number
    showPopoutsForResultBox: (index: number) => void
    selectItem: (itemData: any, remove: boolean) => void
    isBulkSelected: boolean
    shiftSelectItem: () => void
    uploadedPdfLinkLoadState: TaskState
    getRootElement: () => HTMLElement
    copyLoadingState: UITaskState
}

export default class PageResultView extends PureComponent<Props> {
    private get fullUrl(): string {
        return this.props.type === 'pdf'
            ? this.props.fullPdfUrl!
            : this.props.fullUrl
    }

    spacePickerButtonRef = React.createRef<HTMLDivElement>()
    spacePickerBarRef = React.createRef<HTMLDivElement>()
    copyPasteronPageButtonRef = React.createRef<HTMLDivElement>()

    private get domain(): string {
        let fullUrl: URL
        try {
            fullUrl = new URL(this.fullUrl)
        } catch (err) {
            return ''
        }

        if (fullUrl.protocol.startsWith('http')) {
            return decodeURIComponent(fullUrl.hostname.replace('www.', ''))
        } else if (fullUrl.protocol === 'file:') {
            return decodeURIComponent(fullUrl.pathname)
        }
        return ''
    }

    private spacePickerRef = createRef<HTMLElement>()
    private settingsButtonRef = createRef<HTMLElement>()
    private tutorialButtonRef = createRef<HTMLElement>()

    private get hasNotes(): boolean {
        return (
            this.props.hasNotes ||
            this.props.noteIds[this.props.notesType].length > 0
        )
    }

    private get hasLists(): boolean {
        const userLists = this.props.lists.filter(
            (listId) =>
                !Object.values(SPECIAL_LIST_IDS).includes(listId) &&
                listId !== this.props.filteredbyListID,
        )
        return userLists.length > 0
    }

    private get displayLists(): Array<{
        id: number
        name: string | JSX.Element
        isShared: boolean
        type: 'page-link' | 'user-list' | 'special-list'
    }> {
        return this.props.lists
            .map((id) => ({
                id,
                ...this.props.getListDetailsById(id),
            }))
            .filter(
                (list) =>
                    list.type !== 'page-link' &&
                    !Object.values(SPECIAL_LIST_IDS).includes(list.id) &&
                    list.id !== this.props.filteredbyListID,
            )
    }

    private get listPickerBtnClickHandler() {
        if (this.props.listPickerShowStatus === 'footer') {
            return this.props.onListPickerFooterBtnClick
        }
        return this.props.onListPickerBarBtnClick
    }

    private renderSpacePicker() {
        if (this.props.listPickerShowStatus === 'lists-bar') {
            return (
                <PopoutBox
                    targetElementRef={this.spacePickerBarRef.current}
                    placement={'bottom-end'}
                    offsetX={10}
                    closeComponent={this.listPickerBtnClickHandler}
                    strategy={'fixed'}
                    getPortalRoot={this.props.getRootElement}
                >
                    <CollectionPicker
                        annotationsCache={this.props.annotationsCache}
                        selectEntry={(listId) =>
                            this.props.onListPickerUpdate({
                                added: listId,
                                deleted: null,
                                selected: [],
                            })
                        }
                        unselectEntry={(listId) =>
                            this.props.onListPickerUpdate({
                                added: null,
                                deleted: listId,
                                selected: [],
                            })
                        }
                        initialSelectedListIds={() => this.props.lists}
                        closePicker={() => this.listPickerBtnClickHandler}
                        analyticsBG={this.props.analyticsBG}
                    />
                </PopoutBox>
            )
        }

        if (this.props.listPickerShowStatus === 'footer') {
            return (
                <PopoutBox
                    targetElementRef={this.spacePickerButtonRef.current}
                    placement={'bottom-start'}
                    offsetX={10}
                    closeComponent={this.listPickerBtnClickHandler}
                    strategy={'fixed'}
                    getPortalRoot={this.props.getRootElement}
                >
                    <CollectionPicker
                        annotationsCache={this.props.annotationsCache}
                        analyticsBG={this.props.analyticsBG}
                        selectEntry={(listId) =>
                            this.props.onListPickerUpdate({
                                added: listId,
                                deleted: null,
                                selected: [],
                            })
                        }
                        unselectEntry={(listId) =>
                            this.props.onListPickerUpdate({
                                added: null,
                                deleted: listId,
                                selected: [],
                            })
                        }
                        initialSelectedListIds={() => this.props.lists}
                        closePicker={() => this.listPickerBtnClickHandler}
                    />
                </PopoutBox>
            )
        }
    }

    private renderCopyPaster() {
        if (this.props.isCopyPasterShown) {
            return (
                <PopoutBox
                    targetElementRef={this.copyPasteronPageButtonRef.current}
                    placement={'bottom-end'}
                    offsetX={10}
                    strategy={'fixed'}
                    closeComponent={this.props.onCopyPasterBtnClick}
                    getPortalRoot={this.props.getRootElement}
                >
                    <PageNotesCopyPaster
                        normalizedPageUrls={[this.props.normalizedUrl]}
                        onClickOutside={this.props.onCopyPasterBtnClick}
                        getRootElement={this.props.getRootElement}
                    />
                </PopoutBox>
            )
        }
    }

    private renderRemoveFromListBtn(): JSX.Element {
        if (
            !this.props.isSearchFilteredByList ||
            this.props.hoverState == null
        ) {
            return undefined
        }

        return (
            <TooltipBox
                tooltipText={
                    this.props.filteredbyListID === SPECIAL_LIST_IDS.INBOX
                        ? 'Remove from Inbox'
                        : 'Remove from Space'
                }
                placement="bottom"
                getPortalRoot={this.props.getRootElement}
            >
                <Icon
                    heightAndWidth="22px"
                    filePath={icons.removeX}
                    darkBackground
                    onClick={(event) => {
                        {
                            this.props.onRemoveFromListBtnClick(event)
                            event.preventDefault()
                        }
                    }}
                />
            </TooltipBox>
        )
    }
    private renderBulkSelectBtn(): JSX.Element {
        if (this.props.hoverState == null && !this.props.isBulkSelected) {
            return undefined
        }

        return (
            <BulkSelectButtonBox>
                <CheckboxNotInput
                    isChecked={this.props.isBulkSelected}
                    onClick={(event: React.MouseEvent<HTMLInputElement>) => {
                        if (event.nativeEvent.shiftKey) {
                            this.props.shiftSelectItem()
                            event.preventDefault()
                            event.stopPropagation()
                        } else {
                            const itemData = {
                                url: this.props.normalizedUrl,
                                title: this.props.fullTitle,
                                type: 'page',
                            }
                            if (this.props.isBulkSelected) {
                                this.props.selectItem(itemData, true)
                            } else {
                                this.props.selectItem(itemData, false)
                            }
                            event.preventDefault()
                            event.stopPropagation()
                        }
                    }}
                    size={16}
                />
            </BulkSelectButtonBox>
        )
    }

    private renderSpacesButton(): ItemBoxBottomAction[] {
        return [
            {
                key: 'add-spaces-btn',
                image: 'plus',
                imageColor: 'prime1',
                ButtonText: 'Spaces',
                iconSize: '14px',
                onClick: (event) => {
                    this.props.showPopoutsForResultBox(this.props.index)
                    this.props.onListPickerFooterBtnClick(event)
                },
                buttonRef: this.spacePickerButtonRef,
                active: this.props.listPickerShowStatus === 'footer',
            },
        ]
    }

    private calcFooterActions(): ItemBoxBottomAction[] {
        // if (this.props.hoverState === null) {
        //     return [
        //         {
        //             key: 'expand-notes-btn',
        //             image: this.hasNotes ? 'commentFull' : 'commentAdd',
        //             ButtonText:
        //                 this.props.noteIds[this.props.notesType].length > 0 &&
        //                 this.props.noteIds[
        //                     this.props.notesType
        //                 ].length.toString(),
        //             imageColor: 'prime1',
        //             onClick: this.props.onNotesBtnClick,
        //             tooltipText: (
        //                 <span>
        //                     <strong>Add/View Notes</strong>
        //                     <br />
        //                     shift+click to open inline
        //                 </span>
        //             ),
        //         },
        //     ]
        // }

        return [
            {
                key: 'add-spaces-to-note-btn',
                image: 'plus',
                onClick: (event) => {
                    this.props.showPopoutsForResultBox(this.props.index)
                    this.props.onListPickerFooterBtnClick(event)
                },
                tooltipText: 'Add to Space(s)',
                ButtonText: 'Spaces',
                active: this.props.listPickerShowStatus === 'footer',
                buttonRef: this.spacePickerButtonRef,
            },
            {
                key: 'copy-paste-page-btn',
                image:
                    this.props.copyLoadingState === 'success'
                        ? 'check'
                        : 'copy',
                isLoading: this.props.copyLoadingState === 'running',
                onClick: (event) => {
                    if (event.shiftKey) {
                        this.props.onCopyPasterDefaultExecute(event)
                    } else {
                        this.props.onCopyPasterBtnClick?.(event)
                    }
                },
                buttonRef: this.copyPasteronPageButtonRef,
                ButtonText: 'Cite',
                tooltipText: (
                    <span>
                        <strong>Click</strong>
                        to select templates
                        <br />{' '}
                        <strong
                            style={{
                                color: 'white',
                                marginRight: '3px',
                            }}
                        >
                            Shift + Click
                        </strong>
                        to use default
                        <br />
                    </span>
                ),
                active: this.props.isCopyPasterShown,
            },
            {
                key: 'ask-ai-on-page-btn',
                image: 'feed',
                onClick: (event) => {
                    this.props.onAIResultBtnClick(event)
                },
                tooltipText: 'Ask AI & Summarise page',
                ButtonText: 'Ask AI',
                buttonRef: null,
            },
            {
                key: 'expand-notes-btn',
                image: this.hasNotes ? 'commentFull' : 'commentAdd',
                ButtonText:
                    this.props.noteIds[this.props.notesType].length > 0 ? (
                        <span>
                            Notes{' '}
                            <NoteCounter>
                                {this.props.noteIds[
                                    this.props.notesType
                                ]?.length.toString()}
                            </NoteCounter>
                        </span>
                    ) : (
                        'Add Notes'
                    ),
                imageColor:
                    this.props.noteIds[this.props.notesType].length > 0
                        ? 'prime1'
                        : null,
                onClick: this.props.onNotesBtnClick,
                tooltipText: (
                    <span>
                        <strong>Add/View Notes</strong>
                        <br />
                        shift+click to open inline
                    </span>
                ),
            },
        ]
    }

    render() {
        const hasTitle = this.props.fullTitle && this.props.fullTitle.length > 0
        return (
            <ItemBox
                onMouseEnter={this.props.onMainContentHover}
                onMouseOver={this.props.onMainContentHover}
                onMouseLeave={this.props.onUnhover}
                active={this.props.activePage}
                firstDivProps={{
                    // onMouseLeave: this.props.onUnhover,
                    onDragStart: this.props.onPageDrag,
                    onDragEnd: this.props.onPageDrop,
                }}
            >
                {this.props.uploadedPdfLinkLoadState === 'running' ? (
                    <LoadingBox>
                        <LoadingIndicator size={30} />
                    </LoadingBox>
                ) : (
                    <StyledPageResult>
                        <PageContentBox
                            // onMouseOver={this.props.onMainContentHover}
                            // onMouseLeave={
                            //     this.props.listPickerShowStatus !== 'hide'
                            //         ? this.listPickerBtnClickHandler
                            //         : undefined
                            // }
                            tabIndex={-1}
                            hasSpaces={this.displayLists.length > 0}
                        >
                            {this.props.hoverState != null ||
                            this.props.isBulkSelected ? (
                                <PageActionBox>
                                    {this.props.hoverState != null && (
                                        <ExtraButtonsActionBar>
                                            {' '}
                                            <Icon
                                                heightAndWidth="20px"
                                                filePath={icons.edit}
                                                onClick={() => {
                                                    this.props.onEditTitleChange(
                                                        this.props
                                                            .normalizedUrl,
                                                        this.props.fullTitle ??
                                                            this.props
                                                                .normalizedUrl,
                                                    )
                                                }}
                                            />
                                            <Icon
                                                heightAndWidth="20px"
                                                filePath={icons.trash}
                                                onClick={
                                                    this.props.onTrashBtnClick
                                                }
                                            />
                                        </ExtraButtonsActionBar>
                                    )}

                                    {this.renderBulkSelectBtn()}
                                </PageActionBox>
                            ) : undefined}

                            <BlockContent
                                type={this.props.type}
                                normalizedUrl={this.props.normalizedUrl}
                                originalUrl={this.fullUrl}
                                onClick={this.props.onClick}
                                fullTitle={this.props.fullTitle}
                                pdfUrl={this.props.fullPdfUrl}
                                favIcon={this.props.favIconURI}
                                youtubeService={this.props.youtubeService}
                                removeFromList={this.renderRemoveFromListBtn()}
                                mainContentHover={
                                    this.props.hoverState != null
                                        ? this.props.hoverState
                                        : undefined
                                }
                                memexIcon={MemexIcon}
                                getRootElement={this.props.getRootElement}
                                onEditTitleChange={(changedTitle) => {
                                    this.props.onEditTitleChange(
                                        this.props.normalizedUrl,
                                        changedTitle,
                                    )
                                }}
                                onEditTitleSave={(changedTitle) => {
                                    this.props.onEditTitleSave(
                                        this.props.normalizedUrl,
                                        changedTitle,
                                    )
                                }}
                                editTitleState={this.props.editTitleState}
                            />
                        </PageContentBox>
                        {this.displayLists.length > 0 && (
                            <ListsSegment
                                lists={this.displayLists}
                                onListClick={(listId) => {
                                    this.props.filterbyList(listId)
                                }}
                                onEditBtnClick={
                                    this.props.onListPickerBarBtnClick
                                }
                                renderSpacePicker={
                                    this.props.listPickerShowStatus ===
                                    'lists-bar'
                                        ? this.renderSpacePicker
                                        : null
                                }
                                filteredbyListID={this.props.filteredbyListID}
                                padding={'0px 20px 0px 20px'}
                                spacePickerButtonRef={this.spacePickerBarRef}
                            />
                        )}
                        <FooterBar>
                            <ItemBoxBottom
                                // firstDivProps={{
                                //     onMouseEnter: this.props.onFooterHover,
                                //     onMouseOver: this.props.onFooterHover,
                                // }}
                                creationInfo={{
                                    createdWhen: this.props.displayTime,
                                }}
                                actions={this.calcFooterActions()}
                                spacesButton={this.renderSpacesButton()}
                                getRootElement={this.props.getRootElement}
                            />
                        </FooterBar>
                        {this.renderSpacePicker()}
                        {this.renderCopyPaster()}
                    </StyledPageResult>
                )}
            </ItemBox>
        )
    }
}

import { keyframes } from 'styled-components'

const slideInFromBottom = keyframes`
  0% {
    transform: translateY(100%);
    opacity: 0;
  }
  60% {
    transform: translateY(0%);
    opacity: 0.9;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
`

const FooterBar = styled.div`
    animation: ${slideInFromBottom} 0.2s cubic-bezier(0.22, 0.61, 0.36, 1)
        forwards;
    bottom: 0;
    width: 100%;
    backdrop-filter: blur(10px);
    background: ${(props) => props.theme.colors.greyScale0_5}90;
    z-index: 999999;
    border-radius: 0 0 10px 10px;
`

const ExtraButtonsActionBar = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 5px;
    justify-content: center;
    animation: slideInFromRight 0.3s cubic-bezier(0.22, 0.68, 0.36, 1) forwards;

    @keyframes slideInFromRight {
        0% {
            transform: translateX(100%);
            opacity: 0;
        }
        60% {
            opacity: 0.3;
        }
        100% {
            transform: translateX(0);
            opacity: 1;
        }
    }
`

const BulkSelectButtonBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
`

const StyledPageResult = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
    border-radius: 12px;

    ${(props) =>
        props.theme.variant === 'light' &&
        css`
            box-shadow: ${props.theme.borderStyles
                .boxShadowHoverElementsLighter};
            border: 1px solid ${props.theme.colors.greyScale2};
        `};
`

const PageContentBox = styled.div<{ hasSpaces: boolean }>`
    display: flex;
    flex-direction: column;
    cursor: pointer;
    text-decoration: none;
    border-radius: 10px;
    position: relative;
`

const LoadingBox = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 80px;
    width: 100%;
`

const PageActionBox = styled.div`
    display: flex;
    justify-content: space-between;
    grid-gap: 5px;
    padding: 5px;
    position: absolute;
    top: 15px;
    right: 15px;
    z-index: 999;
    background: ${(props) => props.theme.colors.black}95;
    backdrop-filter: blur(5px);
    border-radius: 8px;
    align-items: center;
`

const NoteCounter = styled.span`
    color: ${(props) => props.theme.colors.black};
    font-weight: 400;
    font-size: 12px;
    margin-left: 5px;
    border-radius: 30px;
    padding: 2px 10px;
    min-width: 30px;
    background: ${(props) => props.theme.colors.headerGradient};
    text-align: center;
`
