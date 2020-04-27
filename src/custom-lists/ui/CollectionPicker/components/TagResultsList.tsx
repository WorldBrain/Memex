import React from 'react'
import styled from 'styled-components'
import TagRowItem from './TagRow'
import { DisplayTag } from 'src/tags/ui/TagPicker/logic'
import { Check, MinusCircle } from '@styled-icons/feather'
import { StyledIconBase } from '@styled-icons/styled-icon'
import { fontSizeSmall } from 'src/common-ui/components/design-library/typography'

interface Props {
    tags: DisplayTag[]
    renderTagRow: (tag: DisplayTag, index: number) => React.ReactElement<any>
}

export default class TagResultsList extends React.Component<Props> {
    render = () => {
        return (
            <StyledContainer id={'tagResults'}>
                {/*<FilterHelp>
                    Select tags to include
                    <Check size={18} /> or exclude
                    <MinusCircle size={18} />
                </FilterHelp>
                */}
                {this.props.tags?.map(this.props.renderTagRow) || null}
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
