import React, { PureComponent } from 'react'
import styled from 'styled-components'

import {
    RootState,
    PageResult as PageResultData,
    PageData,
    PageInteractionProps,
    NoteInteractionProps,
} from './types'
import TopBar from './components/result-top-bar'
import SearchTypeSwitch, {
    Props as SearchTypeSwitchProps,
} from './components/search-type-switch'
import ExpandAllNotes from './components/expand-all-notes'
import DayResultGroup from './components/day-result-group'
import PageResult from './components/page-result'
import { setupInteractionProps } from './util'

// TODO: figure out what old logic was doing
const timestampToString = (timestamp: number) => timestamp.toString()

export type Props = RootState &
    Pick<
        SearchTypeSwitchProps,
        'onNotesSearchSwitch' | 'onPagesSearchSwitch'
    > & {
        onShowAllNotesClick: React.MouseEventHandler
        pageInteractionProps: PageInteractionProps
        noteInteractionProps: NoteInteractionProps
    }

export default class SearchResultsContainer extends PureComponent<Props> {
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
                <PageResult
                    key={page.normalizedUrl + day.toString()}
                    {...page}
                    {...interactionProps}
                />
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
