import React, { PureComponent } from 'react'
import styled from 'styled-components'

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
import NoteResult from './components/note-result'
import { bindFunctionalProps, formatDayGroupTime } from './util'
import NotesTypeDropdownMenu from './components/notes-type-dropdown-menu'
import { SortingDropdownMenuBtn } from 'src/sidebar/annotations-sidebar/components/SortingDropdownMenu'
import { AnnotationsSorter } from 'src/sidebar/annotations-sidebar/sorting'
import {
    AnnotationCreate,
    AnnotationCreateEventProps,
} from 'src/annotations/components/AnnotationCreate'

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
    }

export default class SearchResultsContainer extends PureComponent<Props> {
    private renderNoteResult = (day: number, pageId: string) => (
        noteId: string,
    ) => {
        const noteData = this.props.noteData.byId[noteId]

        const interactionProps = bindFunctionalProps<
            NoteInteractionAugdProps,
            NoteInteractionProps
        >(this.props.noteInteractionProps, noteId, day, pageId)

        const pickerProps = bindFunctionalProps<
            NotePickerAugdProps,
            NotePickerProps
        >(this.props.notePickerProps, noteId)

        return (
            <NoteResult
                key={noteId}
                {...noteData}
                {...interactionProps}
                {...pickerProps}
            />
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

    private renderResultsByDay() {
        const days: JSX.Element[] = []

        for (const { day, pages } of Object.values(this.props.results)) {
            days.push(
                <DayResultGroup key={day} when={timestampToString(day)}>
                    {pages.allIds.map((id) => this.renderPageResult(id, day))}
                </DayResultGroup>,
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

const ResultsContainer = styled.div`
    display: flex;
`
