import React, { ReactNode } from 'react'
import styled from 'styled-components'
import { DisplayEntry } from '../types'
import { StyledIconBase } from '@styled-icons/styled-icon'
import { fontSizeSmall } from 'src/common-ui/components/design-library/typography'

interface Props {
    entries: DisplayEntry[]
    renderEntryRow: (list: DisplayEntry, index: number) => ReactNode
    emptyView?: ReactNode
    id: string
}

export default class EntryResultsList extends React.Component<Props> {
    renderMain() {
        if (!this.props.entries || !this.props.entries.length) {
            return this.props.emptyView
        }

        return this.props.entries.map(this.props.renderEntryRow)
    }

    render = () => {
        return (
            <StyledContainer id={this.props.id}>
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

const StyledContainer = styled.div`
    overflow-y: auto;
    max-height: 280px;
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
