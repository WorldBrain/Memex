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
    SearchType,
} from '../types'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import ListsSegment from 'src/common-ui/components/result-item-spaces-segment'
import type { ListDetailsGetter } from 'src/annotations/types'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import BlockContent from '@worldbrain/memex-common/lib/common-ui/components/block-content'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { YoutubeService } from '@worldbrain/memex-common/lib/services/youtube'
import browser from 'webextension-polyfill'
import CheckboxNotInput from 'src/common-ui/components/CheckboxNotInput'
import { TaskState } from 'ui-logic-core/lib/types'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import { keyframes } from 'styled-components'
import CreationInfo from '@worldbrain/memex-common/lib/common-ui/components/creation-info'
import { sleepPromise } from 'src/util/promises'
import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import TutorialBox from '@worldbrain/memex-common/lib/common-ui/components/tutorial-box'

const MemexIcon = browser.runtime.getURL('img/memex-icon.svg')

export interface Props
    extends Omit<PageData, 'lists'>,
        PageResult,
        PageInteractionProps {
    getListDetailsById: ListDetailsGetter
    isSearchFilteredByList: boolean
    filteredbyListID?: number
    youtubeService: YoutubeService
    lists: number[]
    filterbyList: (listId: number) => void
    index: number
    showPopoutsForResultBox: (index: number) => void
    selectItem: (itemData: any, remove: boolean) => void
    shiftSelectItem: () => void
    isBulkSelected: boolean
    uploadedPdfLinkLoadState: TaskState
    getRootElement: () => HTMLElement
    copyLoadingState: UITaskState
    inPageMode?: boolean
    resultsRef?: React.RefObject<HTMLDivElement>
    searchTerms?: string[]
    onMatchingTextToggleClick: React.MouseEventHandler
    renderPageCitations: () => JSX.Element
    renderSpacePicker: () => JSX.Element
    isNotesSidebarShown?: boolean
    isListsSidebarShown?: boolean
    searchType: SearchType
    hasNotes: boolean
    isInFocus?: boolean
}

export default class PageResultView extends PureComponent<Props> {
    private get fullUrl(): string {
        return this.props.type === 'pdf'
            ? this.props.fullPdfUrl!
            : this.props.fullUrl
    }

    static ALT_KEY =
        getKeyName({ key: 'alt' }).charAt(0).toUpperCase() +
        getKeyName({ key: 'alt' }).slice(1)

    private maxMatchingTextContainerHeight = 200
    spacePickerButtonRef = React.createRef<HTMLDivElement>()
    spacePickerBarRef = React.createRef<HTMLDivElement>()
    copyPasteronPageButtonRef = React.createRef<HTMLDivElement>()
    itemBoxRef = React.createRef<HTMLDivElement>() // Assuming ItemBox renders a div element
    citeMenuButtonRef = React.createRef<HTMLDivElement>()

    private matchingTextContainerObserver: ResizeObserver
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

    componentDidUpdate(prevProps: Props) {
        if (this.props.isInFocus && !prevProps.isInFocus) {
            this.setupKeyListener()
            const itemBox = this.itemBoxRef.current
            if (itemBox && !this.props.hoverState) {
                itemBox.scrollIntoView({ block: 'center' })
            }
        } else if (!this.props.isInFocus && prevProps.isInFocus) {
            this.removeKeyListener()
        }
    }

    state = {
        matchingTextContainerHeight: 100,
        confirmRemoveFromList: false,
        showVideoFullSize: false,
        tutorialId: null,
        showFooterBar: false,
        searchTermMatches: null,
    }

    componentDidMount() {
        this.updateMatchingTextContainerHeight()
        this.matchingTextContainerObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                this.updateMatchingTextContainerHeight()
            }
        })

        const matchingTextContainer = document.getElementById(
            'matching-text-container',
        )
        if (matchingTextContainer) {
            this.matchingTextContainerObserver.observe(matchingTextContainer)
        }

        this.getMatches(this.props.text)
    }

    updateMatchingTextContainerHeight = async () => {
        await sleepPromise(50)

        const matchingTextContainer = document.getElementById(
            'matching-text-container-' + this.props.index,
        )

        if (matchingTextContainer) {
            this.setState({
                matchingTextContainerHeight: matchingTextContainer.scrollHeight,
            })
        }
    }

    componentWillUnmount() {
        this.removeKeyListener()
        if (this.matchingTextContainerObserver) {
            this.matchingTextContainerObserver.disconnect()
        }
    }

    setupKeyListener = () => {
        document.addEventListener('keydown', this.handleKeyDown)
    }

    removeKeyListener = () => {
        document.removeEventListener('keydown', this.handleKeyDown)
    }

    handleKeyDown = (event: KeyboardEvent) => {
        if (!this.props.isInFocus) return
        if (document.getElementById('popout-boxes') != null) {
            return
        } else {
            switch (event.key) {
                case 's':
                    // Perform action for "s" key
                    this.props.showPopoutsForResultBox(this.props.index)
                    this.props.onListPickerFooterBtnClick(event as any)
                    break
                case 'c':
                    // Perform action for "c" key
                    if (event.shiftKey) {
                        this.props.onCopyPasterDefaultExecute(event as any)
                        break
                    } else {
                        this.props.onCopyPasterBtnClick?.(event as any)
                        break
                    }
                    break
                case 'y':
                    // Perform action for "y" key
                    this.props.onAIResultBtnClick(event as any)
                    break
                    break
                case 'd':
                    // Perform action for "n" key
                    this.props.onNotesBtnClick(event as any)
                    break
                    break
                case 'ArrowRight':
                    // Perform action for "n" key
                    this.props.onNotesBtnClick(event as any)
                    break
                    break
                case 'ArrowLeft':
                    // Perform action for "n" key
                    this.props.onNotesBtnClick(event as any)
                    break
                    break
                case 'Enter':
                    if (this.props.editTitleState == null) {
                        if (event.shiftKey) {
                            event.stopPropagation()
                            // Perform action for "shift+Enter" key
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
                        } else {
                            // Perform action for "Enter" key
                            event.stopPropagation()
                            this.props.onClick(event as any)
                            break
                        }
                    }
                    break
                case 'Backspace':
                    if (event.shiftKey) {
                        event.stopPropagation()
                        // Perform action for "shift+Enter" key
                        this.props.onRemoveFromListBtnClick(event as any)
                    } else {
                        // Perform action for "Enter" key
                        event.stopPropagation()
                        this.props.onTrashBtnClick(false)
                        break
                    }
                    // Perform action for "Backspace" key
                    break
                default:
                    break
            }
        }
    }

    private spacePickerRef = createRef<HTMLElement>()
    private settingsButtonRef = createRef<HTMLElement>()
    private tutorialButtonRef = createRef<HTMLElement>()

    private get hasNotes(): boolean {
        return this.props.hasNotes || this.props.totalAnnotationCount > 0
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

    private listPickerBtnClickHandler(event: React.MouseEvent) {
        if (this.props.listPickerShowStatus === 'footer') {
            return this.props.onListPickerFooterBtnClick(event)
        }
        return this.props.onListPickerBarBtnClick
    }

    private renderPageCitationsDropdown() {
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
                    {this.props.renderPageCitations()}
                </PopoutBox>
            )
        }
    }

    private renderSpacePicker() {
        if (this.props.listPickerShowStatus === 'lists-bar') {
            return (
                <PopoutBox
                    targetElementRef={this.spacePickerBarRef.current}
                    placement={'bottom-end'}
                    offsetX={10}
                    closeComponent={(event) =>
                        this.listPickerBtnClickHandler(event)
                    }
                    strategy={'fixed'}
                    getPortalRoot={this.props.getRootElement}
                >
                    {this.props.renderSpacePicker()}
                </PopoutBox>
            )
        }

        if (this.props.listPickerShowStatus === 'footer') {
            return (
                <PopoutBox
                    targetElementRef={this.spacePickerButtonRef.current}
                    placement={'bottom-start'}
                    offsetX={10}
                    closeComponent={(event) =>
                        this.listPickerBtnClickHandler(event)
                    }
                    strategy={'fixed'}
                    getPortalRoot={this.props.getRootElement}
                >
                    {this.props.renderSpacePicker()}
                </PopoutBox>
            )
        }
    }

    private renderVideoResizeButton() {
        if (!this.props.fullUrl.includes('youtube.com')) {
            return
        }

        return (
            <TooltipBox
                tooltipText={
                    this.state.showVideoFullSize
                        ? 'Minimize Video'
                        : 'Maximize Video'
                }
                placement="bottom"
                getPortalRoot={this.props.getRootElement}
            >
                <Icon
                    heightAndWidth="22px"
                    filePath={
                        this.state.showVideoFullSize
                            ? icons.compress
                            : icons.expand
                    }
                    onClick={(event) => {
                        {
                            this.setState({
                                showVideoFullSize: !this.state
                                    .showVideoFullSize,
                            })
                            event.preventDefault()
                        }
                    }}
                />
            </TooltipBox>
        )
    }

    private renderRemoveFromListBtn(): JSX.Element {
        if (
            !this.props.isSearchFilteredByList ||
            this.props.hoverState == null
        ) {
            return undefined
        }

        if (this.state.confirmRemoveFromList) {
            return (
                <TooltipBox
                    tooltipText={'Confirm'}
                    placement="bottom"
                    getPortalRoot={this.props.getRootElement}
                >
                    <Icon
                        heightAndWidth="22px"
                        filePath={icons.check}
                        onClick={(event) => {
                            {
                                this.props.onRemoveFromListBtnClick(event)
                                this.setState({ confirmRemoveFromList: true })
                                event.preventDefault()
                            }
                        }}
                    />
                </TooltipBox>
            )
        }

        return (
            <TooltipBox
                tooltipText={
                    this.props.filteredbyListID === SPECIAL_LIST_IDS.INBOX ? (
                        <span>
                            Remove from Inbox
                            <br />
                            <strong>+ shift + Click</strong> or{' '}
                            <strong>+ shift + Backspace</strong> to remove
                            without confirmation
                        </span>
                    ) : (
                        <span>
                            Remove from Space
                            <br />
                            <strong>+ shift + Click</strong> or{' '}
                            <strong>+ shift + Backspace</strong> to remove
                            without confirmation
                        </span>
                    )
                }
                placement="bottom"
                getPortalRoot={this.props.getRootElement}
            >
                <Icon
                    heightAndWidth="22px"
                    filePath={icons.removeX}
                    onClick={(event) => {
                        if (event.shiftKey) {
                            this.props.onRemoveFromListBtnClick(event)
                            this.setState({ confirmRemoveFromList: true })
                        } else {
                            this.setState({ confirmRemoveFromList: true })
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
            <TooltipBox
                tooltipText={
                    <span>
                        Multi Select Items
                        {/* }
                        <br />
                        <strong>Shift+Enter</strong>when item in focus */}
                    </span>
                }
                placement="bottom"
                getPortalRoot={this.props.getRootElement}
            >
                <BulkSelectButtonBox>
                    <CheckboxNotInput
                        isChecked={this.props.isBulkSelected}
                        onClick={(
                            event: React.MouseEvent<HTMLInputElement>,
                        ) => {
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
            </TooltipBox>
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

    renderTutorialBox = () => {
        if (this.state.tutorialId !== null) {
            return (
                <TutorialBox
                    tutorialId={this.state.tutorialId}
                    getRootElement={this.props.getRootElement}
                    isHeadless
                    onTutorialClose={() => this.setState({ tutorialId: null })}
                />
            )
        }
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
                onClick: (e) => {
                    if (e.altKey) {
                        this.setState({
                            tutorialId: 'organiseSpaces',
                        })
                    } else {
                        this.props.showPopoutsForResultBox(this.props.index)
                        this.props.onListPickerFooterBtnClick(e)
                    }
                },
                tooltipText: (
                    <TooltipContent>
                        <TooltipContentBox>
                            Add to Space(s)
                            <div>
                                <strong>
                                    {PageResultView.ALT_KEY} + Click
                                </strong>
                                for tutorials
                            </div>
                        </TooltipContentBox>
                    </TooltipContent>
                ),
                ButtonText:
                    !(
                        this.props.isNotesSidebarShown &&
                        this.props.isListsSidebarShown
                    ) && 'Spaces',
                active: this.props.listPickerShowStatus === 'footer',
                buttonRef: this.spacePickerButtonRef,
                showKeyShortcut: this.props.isInFocus && 'S',
            },
            {
                key: 'copy-paste-page-btn',
                image:
                    this.props.copyLoadingState === 'success'
                        ? 'check'
                        : 'copy',
                isLoading: this.props.copyLoadingState === 'running',
                buttonRef: this.copyPasteronPageButtonRef,
                ButtonText:
                    !(
                        this.props.isNotesSidebarShown &&
                        this.props.isListsSidebarShown
                    ) && 'Cite',

                onClick: (e) => {
                    if (e.altKey) {
                        this.setState({
                            tutorialId: 'useTemplates',
                        })
                    } else if (e.shiftKey) {
                        this.props.onCopyPasterDefaultExecute(e)
                    } else {
                        this.props.onCopyPasterBtnClick(e)
                    }
                },
                tooltipText: (
                    <TooltipContent>
                        <TooltipContentBox>
                            Copy with Template or Share Link
                            <span>
                                <strong>Shift + Click</strong>
                                to use default template
                            </span>
                            <div>
                                <strong>
                                    {PageResultView.ALT_KEY} + Click
                                </strong>
                                for tutorials
                            </div>
                        </TooltipContentBox>
                    </TooltipContent>
                ),
                active: this.props.isCopyPasterShown,
                showKeyShortcut: this.props.isInFocus && 'C',
            },
            {
                key: 'ask-ai-on-page-btn',
                image: 'stars',
                onClick: (e) => {
                    if (e.altKey) {
                        this.setState({
                            tutorialId: 'askAI',
                        })
                    } else {
                        this.props.onAIResultBtnClick(e)
                    }
                },
                tooltipText: (
                    <TooltipContent>
                        <TooltipContentBox>
                            <span>'Ask AI & Summarise page'</span>
                            <div>
                                <strong>
                                    {PageResultView.ALT_KEY} + Click
                                </strong>
                                for tutorials
                            </div>
                        </TooltipContentBox>
                    </TooltipContent>
                ),
                ButtonText:
                    !(
                        this.props.isNotesSidebarShown &&
                        this.props.isListsSidebarShown
                    ) && 'Ask AI',
                buttonRef: null,
                showKeyShortcut: this.props.isInFocus && 'Y',
            },
            {
                key: 'expand-notes-btn',
                // TODO: Simplify this conditional logic
                ButtonText: !(
                    this.props.isNotesSidebarShown &&
                    this.props.isListsSidebarShown
                ) ? (
                    this.props.totalAnnotationCount > 0 ? (
                        <NotesCounterTitle>
                            <Icon
                                heightAndWidth="16px"
                                icon={
                                    this.hasNotes ? 'commentFull' : 'commentAdd'
                                }
                                hoverOff
                            />
                            Notes
                        </NotesCounterTitle>
                    ) : (
                        <NotesCounterTitle>
                            <Icon
                                heightAndWidth="16px"
                                icon={'commentAdd'}
                                hoverOff
                            />
                            Add Notes
                        </NotesCounterTitle>
                    )
                ) : this.props.totalAnnotationCount > 0 ? (
                    <NotesCounterTitle>
                        <Icon
                            heightAndWidth="16px"
                            icon={this.hasNotes ? 'commentFull' : 'commentAdd'}
                            hoverOff
                        />
                    </NotesCounterTitle>
                ) : (
                    <NotesCounterTitle>
                        <Icon
                            heightAndWidth="16px"
                            icon={'commentAdd'}
                            hoverOff
                        />
                    </NotesCounterTitle>
                ),
                imageColor:
                    this.props.totalAnnotationCount > 0 ? 'prime1' : null,

                onClick: (e) => {
                    if (e.altKey) {
                        this.setState({
                            tutorialId: 'annotatePages',
                        })
                    } else {
                        this.props.onNotesBtnClick(e)
                    }
                },
                tooltipText: (
                    <TooltipContent>
                        <TooltipContentBox>
                            Add/View Notes
                            <span>
                                <strong>Shift + Click</strong>
                                to open inline
                            </span>
                            <div>
                                <strong>
                                    {PageResultView.ALT_KEY} + Click
                                </strong>
                                for tutorials
                            </div>
                        </TooltipContentBox>
                    </TooltipContent>
                ),
                showKeyShortcut: this.props.isInFocus && 'D',
                // rightSideItem: this.props.noteIds[this.props.notesType]
                //     ?.length > 0 && (
                //     <NoteCounter>
                //         {this.props.noteIds[
                //             this.props.notesType
                //         ]?.length.toString()}
                //     </NoteCounter>
                // ),
            },
        ]
    }

    renderToggleMatchesButton() {
        if (this.state.matchingTextContainerHeight < 200) {
            return null
        }

        return (
            <MatchingTextViewToggle
                showAll={this.props.showAllResults}
                onClick={this.props.onMatchingTextToggleClick}
            >
                {this.props.showAllResults
                    ? 'Disable Scrolling'
                    : 'Click to Scroll Matches'}
            </MatchingTextViewToggle>
        )
    }

    getMatches = (text: string) => {
        if (this.props.searchTerms.length === 0) {
            return
        }
        const regex = new RegExp(
            `\\b(${this.props.searchTerms.join('|')})\\b`,
            'gi',
        )
        const matches = [...text.matchAll(regex)]
        this.setState({
            searchTermMatches: matches || null,
        })
        return regex
    }

    processPageText(text: string) {
        const matches = this.state.searchTermMatches
        const regex = new RegExp(
            `\\b(${this.props.searchTerms.join('|')})\\b`,
            'gi',
        )

        const chunks = matches.map((match) => {
            const index = match.index || 0
            let beforeIndex = index
            let afterIndex = index + match[0].length
            let beforeWordCount = 0
            let afterWordCount = 0

            // Move backwards from the match index to find the start of the chunk
            while (beforeIndex > 0 && beforeWordCount < 20) {
                beforeIndex--
                if (text[beforeIndex] === ' ' || text[beforeIndex] === '\n') {
                    beforeWordCount++
                } else if (['.', '!', '?'].includes(text[beforeIndex])) {
                    beforeIndex++ // Move back to include the punctuation in the chunk
                    break // Stop if sentence-ending punctuation is found
                }
            }

            // Move forwards from the end of the match index to find the end of the chunk
            while (afterIndex < text.length && afterWordCount < 15) {
                if (text[afterIndex] === ' ' || text[afterIndex] === '\n') {
                    afterWordCount++
                } else if (['.', '!', '?'].includes(text[afterIndex])) {
                    afterWordCount++ // Include the punctuation in the word count
                }
                afterIndex++
                if (['.', '!', '?'].includes(text[afterIndex - 1])) {
                    break // Stop if sentence-ending punctuation is found
                }
            }

            // Extract the chunk of text around the match
            return text.substring(beforeIndex, afterIndex)
        })

        return chunks.map((chunk, i) => (
            <React.Fragment key={i}>
                <ResultTextString>
                    {chunk.split(regex).map((part, index, array) =>
                        index < array.length - 1 &&
                        array[index + 1]?.match(regex)?.length > 0 ? (
                            <React.Fragment key={index}>
                                {part}
                                <HighlightedTerm>
                                    {array[index + 1].match(regex)}
                                </HighlightedTerm>
                            </React.Fragment>
                        ) : (
                            part.replace(regex, '')
                        ),
                    )}
                </ResultTextString>
                {i < chunks.length - 1 && (
                    <ResultTextStringSepararator>
                        ...
                    </ResultTextStringSepararator>
                )}
            </React.Fragment>
        ))
    }

    private renderDeleteButton() {
        return (
            <TooltipBox
                tooltipText={
                    <span>
                        Delete from Memex
                        <br />
                        <strong>+ shift</strong>to delete without confirmation
                    </span>
                }
                placement="bottom"
                getPortalRoot={this.props.getRootElement}
            >
                <Icon
                    heightAndWidth="20px"
                    filePath={icons.trash}
                    onClick={(event) => {
                        let instaDelete = false

                        if (event.shiftKey) {
                            event.preventDefault()
                            event.stopPropagation()
                            instaDelete = true
                        }
                        this.props.onTrashBtnClick(instaDelete)
                        event.preventDefault()
                        event.stopPropagation()
                    }}
                />
            </TooltipBox>
        )
    }

    private renderEditButton() {
        return (
            <TooltipBox
                tooltipText={<span>Edit Title</span>}
                placement="bottom"
                getPortalRoot={this.props.getRootElement}
            >
                <Icon
                    heightAndWidth="20px"
                    filePath={icons.edit}
                    onClick={() => {
                        this.props.onEditTitleChange(
                            this.props.normalizedUrl,
                            this.props.fullTitle ?? this.props.normalizedUrl,
                        )
                    }}
                />
            </TooltipBox>
        )
    }

    render() {
        return (
            <ItemBox
                onMouseEnter={this.props.onMainContentHover}
                // onMouseOver={this.props.onMainContentHover}
                onMouseLeave={this.props.onUnhover}
                active={this.props.activePage}
                firstDivProps={{
                    // onMouseLeave: this.props.onUnhover,
                    onDragStart:
                        !this.props.isCopyPasterShown && this.props.onPageDrag,
                    onDragEnd:
                        !this.props.isCopyPasterShown && this.props.onPageDrop,
                }}
                hoverState={this.props.isInFocus}
                onRef={this.itemBoxRef} // Passing the ref as a prop
            >
                {this.props.uploadedPdfLinkLoadState === 'running' && (
                    <LoadingBox>
                        <LoadingIndicator size={30} />
                        Loading PDF
                    </LoadingBox>
                )}
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
                                        {this.renderEditButton()}
                                        {this.renderVideoResizeButton()}
                                        {this.renderDeleteButton()}
                                        {this.renderRemoveFromListBtn()}
                                    </ExtraButtonsActionBar>
                                )}

                                {this.renderBulkSelectBtn()}
                            </PageActionBox>
                        ) : undefined}

                        <BlockContent
                            type={this.props.type}
                            normalizedUrl={this.props.normalizedUrl}
                            originalUrl={this.fullUrl}
                            onClick={(event) => {
                                this.props.onClick(event)
                            }}
                            fullTitle={this.props.fullTitle}
                            pdfUrl={this.props.fullPdfUrl}
                            favIcon={this.props.favIconURI}
                            showVideoFullScreen={this.state.showVideoFullSize}
                            inPageMode={this.props.inPageMode}
                            youtubeService={this.props.youtubeService}
                            mainContentHover={
                                this.props.hoverState != null
                                    ? this.props.hoverState
                                    : undefined
                            }
                            renderCreationInfo={() => {
                                return this.props.displayTime ? (
                                    <CreationInfo
                                        createdWhen={this.props.displayTime}
                                    />
                                ) : null
                            }}
                            renderSpacePicker={() => {
                                if (this.displayLists.length > 0) {
                                    return (
                                        <ListSegmentContainer>
                                            <ListsSegment
                                                lists={this.displayLists}
                                                onListClick={(listId) => {
                                                    this.props.filterbyList(
                                                        listId,
                                                    )
                                                }}
                                                onEditBtnClick={
                                                    this.props
                                                        .onListPickerBarBtnClick
                                                }
                                                renderSpacePicker={
                                                    this.props
                                                        .listPickerShowStatus ===
                                                    'lists-bar'
                                                        ? this.renderSpacePicker
                                                        : null
                                                }
                                                filteredbyListID={
                                                    this.props.filteredbyListID
                                                }
                                                padding={'0px 20px 0px 20px'}
                                                spacePickerButtonRef={
                                                    this.spacePickerBarRef
                                                }
                                            />
                                        </ListSegmentContainer>
                                    )
                                }
                            }}
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

                    {this.props.searchType !== 'notes' &&
                        this.props.searchTerms?.length > 0 &&
                        this.props.text?.length > 0 &&
                        this.state.searchTermMatches?.length > 0 && (
                            <ResultsMatchingTextToggleContainer
                                showAll={this.props.showAllResults}
                                id={
                                    'matching-text-container-' +
                                    this.props.index
                                }
                                maxHeight={this.maxMatchingTextContainerHeight}
                            >
                                <SearchResultsHighlights>
                                    {this.processPageText(this.props.text)}
                                </SearchResultsHighlights>
                                {this.renderToggleMatchesButton()}
                            </ResultsMatchingTextToggleContainer>
                        )}
                    <FooterBar
                        inPageMode={this.props.inPageMode}
                        shouldShow={
                            (this.props.hoverState === 'main-content' ||
                                this.props.isInFocus) &&
                            !this.props.editTitleState
                        }
                        inFocus={this.props.isInFocus}
                    >
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
                            inPageMode={this.props.inPageMode}
                        />
                    </FooterBar>
                    {this.props.totalAnnotationCount > 0 && (
                        <NoteCounter
                            onClick={(e) => {
                                if (e.altKey) {
                                    this.setState({
                                        tutorialId: 'annotatePages',
                                    })
                                } else {
                                    this.props.onNotesBtnClick(e)
                                }
                            }}
                        >
                            {this.props.totalAnnotationCount}
                        </NoteCounter>
                    )}
                    {this.renderSpacePicker()}
                    {this.renderTutorialBox()}
                    {this.renderPageCitationsDropdown()}
                </StyledPageResult>
            </ItemBox>
        )
    }
}

// const slideInFromBottom = keyframes`
//   0% {
//     transform: translateY(100%);
//     opacity: 0;
//   }
//   60% {
//     transform: translateY(0%);
//     opacity: 0.9;
//   }
//   100% {
//     transform: translateY(0);
//     opacity: 1;
//   }
// `

// const slideOutToBottom = keyframes`
//   0% {
//     transform: translateY(0);
//     opacity: 1;
//   }
//   40% {
//     transform: translateY(0%);
//     opacity: 0.9;
//   }
//   100% {
//     transform: translateY(100%);
//     opacity: 0;
//   }
// `

const slideInFromBottom = keyframes`
  from {
    opacity: 0;
    margin-top: -10px;
  }
  to {
    opacity: 1;
    margin-top: 0px;
  }
`

const FooterBar = styled.div<{
    shouldShow: boolean
    inFocus: boolean
    inPageMode?: boolean
    inTitleEditMode?: boolean
}>`
    bottom: 0;
    width: 100%;
    z-index: 999999;
    border-radius: 0 0 12px 12px;
    padding: 2px 0px 2px 0px;
    background: unset;
    backdrop-filter: unset;
    margin-top: -5px;
    position: relative;
    animation: ${slideInFromBottom} 0.1s cubic-bezier(0.22, 0.61, 0.36, 1)
        forwards;
    display: none;
    background: ${(props) => props.theme.colors.black}98;
    backdrop-filter: blur(5px);

    ${(props) =>
        props.inFocus &&
        css`
            animation: none;
            position: relative;
            display: flex;
        `};
    ${(props) =>
        props.inTitleEditMode &&
        css`
            display: flex;
            position: relative;
        `};
    ${(props) =>
        props.shouldShow &&
        css`
            display: flex;
        `};
    ${(props) =>
        props.inPageMode &&
        css`
            backdrop-filter: unset;
            background: ${(props) => props.theme.colors.black};
        `};
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
    position: absolute;
    top: 0px;
    left: 0px;
    height: 100%;
    width: 100%;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    grid-gap: 15px;
    color: ${(props) => props.theme.colors.greyScale7};
    font-size: 16px;
    font-weight: 300;
    background: ${(props) => props.theme.colors.greyScale1}98;
    backdrop-filter: blur(5px);
    z-index: 10000000;
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

const NotesCounterContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: fill-available;
    position: relative;
`

const NotesCounterTitle = styled.span`
    display: flex;
    align-items: center;
    justify-content: center;
    grid-gap: 5px;
`

const NoteCounter = styled.span`
    color: ${(props) => props.theme.colors.black};
    font-weight: 400;
    font-size: 12px;
    margin-left: 5px;
    border-radius: 30px;
    padding: 2px 10px;
    background: ${(props) => props.theme.colors.headerGradient};
    text-align: center;
    position: absolute;
    right: 10px;
    bottom: 10px;
    cursor: pointer;
    z-index: 9999991; // to be above the footerbar
`

const SearchResultsHighlights = styled.div`
    margin: 10px 0;

    font-size: 14px;
    line-height: 26px;
    color: ${(props) => props.theme.colors.greyScale5};
    width: fill-available;
    padding: 0 20px;

    .matchingQueryTerm {
        color: ${(props) => props.theme.colors.prime1};
    }
`

const HighlightedTerm = styled.span`
    background: ${(props) => props.theme.colors.prime1};
    color: ${(props) => props.theme.colors.black};
    padding: 2px 5px;
    line-height: 21px;
    border-radius: 3px;
`
const ResultTextString = styled.span`
    font-size: 14px;
    line-height: 26px;
`

const ResultTextStringSepararator = styled.span`
    font-size: 14px;
    line-height: 26px;
    color: ${(props) => props.theme.colors.greyScale5};
    background: ${(props) => props.theme.colors.greyScale3};
    padding: 2px 5px;
    border-radius: 3px;
    margin: 0 5px;
`

const MatchingTextViewToggle = styled.div<{ showAll: boolean }>`
    position: sticky;
    padding: 10px 15px;
    bottom: 10px;
    box-sizing: border-box;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${(props) => props.theme.colors.greyScale1}95;
    backdrop-filter: blur(5px);
    color: ${(props) => props.theme.colors.greyScale7};
    border: 1px solid ${(props) => props.theme.colors.greyScale3};
    font-size: 14px;
    cursor: pointer;
    opacity: 0.6;

    transition: all 0.3s ease-in-out;

    &:hover {
        backdrop-filter: blur(10px);
    }

    ${(props) =>
        props.showAll &&
        css`
            right: 10px;
            bottom: 10px;
        `}
`

const ResultsMatchingTextToggleContainer = styled.div<{
    showAll: boolean
    maxHeight: number
}>`
    display: flex;
    flex-direction: column;
border-radius: 0 0 8px 8px;
    align-items: center;
    justify-content: flex-start;
    overflow: hidden;
    max-height: 150px;
    max-height: ${(props) => props.maxHeight}px;
    position: relative;
    padding: 10px 0px;
    border-top: 1px solid ${(props) => props.theme.colors.greyScale2};

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;

    ${(props) =>
        props.showAll &&
        css`
            max-height: 250px;
            overflow: scroll;
        `}

    &:hover ${MatchingTextViewToggle} {
        opacity: 1;
    }
`

const TooltipContentBox = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 5px;

    * strong {
        margin-right: 5px;
    }
`
const TooltipContent = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 10px;
    flex-direction: row;
    justify-content: center;
`

const ListSegmentContainer = styled.div``
