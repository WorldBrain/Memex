import React, { ReactNode } from 'react'
import styled from 'styled-components'
import type { SpaceDisplayEntry } from '../logic'
import { StyledIconBase } from '@styled-icons/styled-icon'
import { fontSizeSmall } from 'src/common-ui/components/design-library/typography'

interface Props {
    entries: SpaceDisplayEntry[]
    renderEntryRow: (list: SpaceDisplayEntry, index: number) => ReactNode
    emptyView?: ReactNode
    query: string
}

export default class EntryResultsList extends React.Component<Props> {
    private containerRef = React.createRef<HTMLDivElement>()

    scrollToTop() {
        this.containerRef.current.scrollTo(0, 0)
    }

    renderMain() {
        if (!this.props.entries || !this.props.entries.length) {
            return this.props.emptyView
        }

        return this.props.entries.map(this.props.renderEntryRow)
    }

    render = () => {
        return (
            <StyledContainer ref={this.containerRef}>
                {this.props.query === '' && (
                    <RecentItemsNotif>Recently used</RecentItemsNotif>
                )}
                {/*<FilterHelp>
                    Select lists to include
                    <Check size={18} /> or exclude
                    <MinusCircle size={18} />
                </FilterHelp>
                */}
                {this.renderMain()}
            </StyledContainer>
        )
    }
}

const RecentItemsNotif = styled.div`
    padding: 5px 10px;
    font-size: 12px;
    color: ${(props) => props.theme.colors.subText};
`

const StyledContainer = styled.div`
    overflow-y: auto;
    max-height: 280px;

    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }
`
const FilterHelp = styled.div`
    font-size: ${fontSizeSmall}px;
    color: ${(props) => props.theme.text};
    padding: 6px 2px;
    ${StyledIconBase} {
        stroke-width: 2px;
        margin: 0 3px;
    }
`
