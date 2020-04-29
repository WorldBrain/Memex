import React from 'react'
import styled from 'styled-components'
import { DisplayList } from 'src/custom-lists/ui/CollectionPicker/logic'
import { StyledIconBase } from '@styled-icons/styled-icon'
import { fontSizeSmall } from 'src/common-ui/components/design-library/typography'

interface Props {
    lists: DisplayList[]
    renderListRow: (list: DisplayList, index: number) => JSX.Element
    emptyView?: JSX.Element
}

export default class ListResultsList extends React.Component<Props> {
    renderMain() {
        if (!this.props.lists || !this.props.lists.length) {
            return this.props.emptyView
        }

        return this.props.lists.map(this.props.renderListRow)
    }

    render = () => {
        return (
            <StyledContainer id={'listResults'}>
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
