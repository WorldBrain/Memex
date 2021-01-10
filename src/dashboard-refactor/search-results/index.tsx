import React, { PureComponent } from 'react'
import styled from 'styled-components'
import Waypoint from 'react-waypoint'

import {
    RootState,
    PageResult as PageResultData,
    PageData,
    PageInteractionAugdProps,
    NoteInteractionAugdProps,
    NotesType,
    NoteInteractionProps,
    PagePickerProps,
    NotePickerProps,
    PageInteractionProps,
    PagePickerAugdProps,
    NotePickerAugdProps,
} from './types'
import TopBar from './components/result-top-bar'
import SearchTypeSwitch, {
    Props as SearchTypeSwitchProps,
} from './components/search-type-switch'
import ExpandAllNotes from './components/expand-all-notes'
import DayResultGroup from './components/day-result-group'
import PageResult from './components/page-result'
import { bindFunctionalProps, formatDayGroupTime } from './util'
import NotesTypeDropdownMenu from './components/notes-type-dropdown-menu'
import { SortingDropdownMenuBtn } from 'src/sidebar/annotations-sidebar/components/SortingDropdownMenu'
import { AnnotationsSorter } from 'src/sidebar/annotations-sidebar/sorting'
import {
    AnnotationCreate,
    AnnotationCreateEventProps,
} from 'src/annotations/components/AnnotationCreate'
import { sizeConstants } from '../constants'
import AnnotationEditable from 'src/annotations/components/AnnotationEditable'
import { LoadingIndicator } from 'src/common-ui/components'

const timestampToString = (timestamp: number) =>
    timestamp === -1 ? undefined : formatDayGroupTime(timestamp)

export type Props = RootState &
    Pick<
        SearchTypeSwitchProps,
        'onNotesSearchSwitch' | 'onPagesSearchSwitch'
    > & {
        areAllNotesShown: boolean
        pageInteractionProps: PageInteractionAugdProps
        noteInteractionProps: NoteInteractionAugdProps
        pagePickerProps: PagePickerAugdProps
        notePickerProps: NotePickerAugdProps
        onShowAllNotesClick: React.MouseEventHandler
        newNoteInteractionProps: {
            [Key in keyof AnnotationCreateEventProps]: (
                day: number,
                pageId: string,
            ) => AnnotationCreateEventProps[Key]
        }
        onPageNotesTypeSelection(
            day: number,
            pageId: string,
        ): (selection: NotesType) => void
        onPageNotesSortSelection(
            day: number,
            pageId: string,
        ): (sorter: AnnotationsSorter) => void
        paginateSearch(): Promise<void>
    }

export default class SearchResultsContainer extends PureComponent<Props> {
    private renderLoader = (props: { key?: string } = {}) => (
        <Loader>
            <LoadingIndicator {...props} />
        </Loader>
    )

    private renderNoteResult = (day: number, pageId: string) => (
        noteId: string,
    ) => {
        const noteData = this.props.noteData.byId[noteId]

        const interactionProps = bindFunctionalProps<
            NoteInteractionAugdProps,
            NoteInteractionProps
        >(this.props.noteInteractionProps, noteId, day, pageId)

        const dummyEvent = {} as any

        return (
            <AnnotationEditable
                key={noteId}
                body={noteData.highlight}
                comment={noteData.comment}
                isBookmarked={noteData.isBookmarked}
                createdWhen={new Date(noteData.displayTime)}
                mode={noteData.isEditing ? 'edit' : 'default'}
                sharingInfo={this.props.noteSharingInfo[noteId]}
                sharingAccess={this.props.sharingAccess}
                renderCopyPasterForAnnotation={() => null}
                renderTagsPickerForAnnotation={() => null}
                renderShareMenuForAnnotation={() => null}
                annotationEditDependencies={{
                    comment: noteData.editNoteForm.inputValue,
                    onCommentChange: (value) =>
                        interactionProps.onCommentChange({
                            target: { value },
                        } as any),
                    onEditCancel: () =>
                        interactionProps.onEditCancel(dummyEvent),
                    onEditConfirm: () =>
                        interactionProps.onEditConfirm(dummyEvent),
                }}
                annotationFooterDependencies={{
                    onDeleteCancel: () => undefined,
                    onDeleteConfirm: () => undefined,
                    onTagIconClick: interactionProps.onTagPickerBtnClick,
                    onDeleteIconClick: interactionProps.onTrashBtnClick,
                    onCopyPasterBtnClick: interactionProps.onCopyPasterBtnClick,
                    onEditCancel: interactionProps.onEditCancel,
                    onEditConfirm: interactionProps.onEditConfirm,
                    onEditIconClick: interactionProps.onEditBtnClick,
                    onShareClick: interactionProps.onShareBtnClick,
                    onUnshareClick: interactionProps.onShareBtnClick,
                    toggleBookmark: interactionProps.onBookmarkBtnClick,
                }}
            />
        )
    }

    private renderPageNotes(
        {
            areNotesShown,
            notesType,
            normalizedUrl,
            newNoteForm,
            noteIds,
        }: PageResultData & PageData,
        day: number,
    ) {
        if (!areNotesShown) {
            return null
        }
        const { newNoteInteractionProps } = this.props

        const boundAnnotCreateProps = bindFunctionalProps<
            typeof newNoteInteractionProps,
            AnnotationCreateEventProps
        >(this.props.newNoteInteractionProps, day, normalizedUrl)

        return (
            <>
                <TopBar
                    leftSide={
                        <NotesTypeDropdownMenu
                            notesTypeSelection={notesType}
                            onNotesTypeSelection={this.props.onPageNotesTypeSelection(
                                day,
                                normalizedUrl,
                            )}
                        />
                    }
                    rightSide={
                        <SortingDropdownMenuBtn
                            onMenuItemClick={({ sortingFn }) =>
                                this.props.onPageNotesSortSelection(
                                    day,
                                    normalizedUrl,
                                )(sortingFn)
                            }
                        />
                    }
                />
                <AnnotationCreate
                    comment={newNoteForm.inputValue}
                    tags={newNoteForm.tags}
                    {...boundAnnotCreateProps}
                />
                {noteIds[notesType].map(
                    this.renderNoteResult(day, normalizedUrl),
                )}
            </>
        )
    }

    private renderPageResult = (pageId: string, day: number) => {
        const page = {
            ...this.props.pageData.byId[pageId],
            ...this.props.results[day].pages.byId[pageId],
        }

        const interactionProps = bindFunctionalProps<
            PageInteractionAugdProps,
            PageInteractionProps
        >(this.props.pageInteractionProps, day, pageId)

        const pickerProps = bindFunctionalProps<
            PagePickerAugdProps,
            PagePickerProps
        >(this.props.pagePickerProps, pageId)

        return (
            <>
                <PageResult
                    key={pageId + day.toString()}
                    {...interactionProps}
                    {...pickerProps}
                    {...page}
                />
                {this.renderPageNotes(page, day)}
            </>
        )
    }

    private renderResultsByDay() {
        if (this.props.searchState === 'running') {
            return this.renderLoader()
        }

        const days: JSX.Element[] = []

        for (const { day, pages } of Object.values(this.props.results)) {
            days.push(
                <DayResultGroup key={day} when={timestampToString(day)}>
                    {pages.allIds.map((id) => this.renderPageResult(id, day))}
                </DayResultGroup>,
            )
        }

        if (this.props.searchPaginationState === 'running') {
            days.push(this.renderLoader({ key: 'loader' }))
        } else if (!this.props.areResultsExhausted) {
            days.push(
                <Waypoint
                    key="pagination-waypoint"
                    onEnter={() => this.props.paginateSearch()}
                />,
            )
        }

        return days
    }

    render() {
        return (
            <ResultsContainer>
                <TopBar
                    leftSide={<SearchTypeSwitch {...this.props} />}
                    rightSide={
                        <ExpandAllNotes
                            isEnabled={this.props.areAllNotesShown}
                            onClick={this.props.onShowAllNotesClick}
                        />
                    }
                />
                {this.renderResultsByDay()}
            </ResultsContainer>
        )
    }
}

const Loader = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
`

const ResultsContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-self: center;
    max-width: ${sizeConstants.searchResults.widthPx}px;
    margin-bottom: 100px;
`
