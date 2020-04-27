import React, { ChangeEvent } from 'react'
import styled from 'styled-components'
import { ActiveList } from 'src/custom-lists/ui/CollectionPicker/components/ActiveList'
import { X as XIcon } from '@styled-icons/feather'
import { darken } from 'polished'

interface Props {
    listsSelected: string[]
    onPress: (list: string) => void
}
export class ListSelectedList extends React.PureComponent<Props> {
    _getListAttr = (event) => event.target.getAttribute('data-list-name')

    handleSelectedTabPress = (event: ChangeEvent) =>
        this.props.onPress(this._getListAttr(event))

    render() {
        return (
            <React.Fragment>
                {this.props.listsSelected?.map((list) => (
                    <StyledActiveList
                        key={`ActiveTab-${list}`}
                        data-list-name={list}
                        onClick={this.handleSelectedTabPress}
                    >
                        {list}
                        <StyledXIcon size={12} />
                    </StyledActiveList>
                ))}
            </React.Fragment>
        )
    }
}

const StyledActiveList = styled(ActiveList)`
    display: inline-flex;
    cursor: pointer;
`

const StyledXIcon = styled(XIcon)`
    stroke: ${(props) => props.theme.tag.text};
    stroke-width: 2px;
    margin-left: 4px;
    display: flex;
    flex-shrink: 0;
    pointer-events: none;

    &:hover {
        stroke-width: 3px;
        stroke: darken(0.2, ${(props) => props.theme.tag.text});
    }
`
