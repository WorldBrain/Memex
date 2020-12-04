import React, { PureComponent } from 'react'
import styled from 'styled-components'

import {
    RootState,
    PageResult as PageResultData,
    PageData,
    PageInteractionProps,
    NoteInteractionProps,
    NotesType,
} from './types'
import TopBar from './components/result-top-bar'
import SearchTypeSwitch, {
    Props as SearchTypeSwitchProps,
} from './components/search-type-switch'
import ExpandAllNotes from './components/expand-all-notes'
import DayResultGroup from './components/day-result-group'
import PageResult from './components/page-result'
import { setupInteractionProps } from './util'
import NotesTypeDropdownMenu from './components/notes-type-dropdown-menu'
import { SortingDropdownMenuBtn } from 'src/sidebar/annotations-sidebar/components/SortingDropdownMenu'
import { AnnotationsSorter } from 'src/sidebar/annotations-sidebar/sorting'
import {
    AnnotationCreate,
    AnnotationCreateEventProps,
} from 'src/annotations/components/AnnotationCreate'
import { GenericPickerDependenciesMinusSave } from 'src/common-ui/GenericPicker/logic'

// TODO: figure out what old logic was doing
const timestampToString = (timestamp: number) => timestamp.toString()

export type Props = RootState &
    Pick<
        SearchTypeSwitchProps,
        'onNotesSearchSwitch' | 'onPagesSearchSwitch'
    > & {
        pageInteractionProps: PageInteractionProps
        noteInteractionProps: NoteInteractionProps
        onShowAllNotesClick: React.MouseEventHandler
        tagPickerDependencies: GenericPickerDependenciesMinusSave
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
    private renderPageNotes(
        {
            areNotesShown,
            notesType,
            normalizedUrl,
            newNoteForm,
        }: PageResultData & PageData,
        day: number,
    ) {
        if (!areNotesShown) {
            return false
        }

        const newNoteInteractionProps = setupInteractionProps<
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
                    {...newNoteInteractionProps}
                    tagPickerDependencies={this.props.tagPickerDependencies}
                />
            </>
        )
    }

    private renderPageResults(
        pages: Array<PageResultData & PageData>,
        day: number,
    ) {
        return pages.map((page) => {
            const interactionProps = setupInteractionProps(
                this.props.pageInteractionProps,
                day,
                page.normalizedUrl,
            )

            return (
                <>
                    <PageResult
                        key={page.normalizedUrl + day.toString()}
                        {...page}
                        {...interactionProps}
                    />
                    {this.renderPageNotes()}
                </>
            )
        })
    }

    private renderResultsByDay() {
        const days: JSX.Element[] = []

        for (const { day, pages } of Object.values(this.props.results)) {
            const pagesData = pages.allIds.map((id) => ({
                ...pages.byId[id],
                ...this.props.pageData.byId[id],
            }))

            days.push(
                <DayResultGroup key={day} when={timestampToString(day)}>
                    {this.renderPageResults(pagesData, day)}
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
