import React, { ChangeEvent } from 'react'
import styled from 'styled-components'

interface Props {
    onChange: (value: string) => void
}
export class TagSearchInput extends React.PureComponent<Props> {
    onChange = (e: ChangeEvent<HTMLInputElement>) =>
        this.props.onChange(e.target.value)

    renderActiveTabList() {
        return (
            <ActiveTabList>
                <ActiveTab> tag 1 </ActiveTab>
                <ActiveTab> tag 2 </ActiveTab>
            </ActiveTabList>
        )
    }

    render() {
        return (
            <div>
                {this.renderActiveTabList()}
                <input onChange={this.onChange} />
            </div>
        )
    }
}

const ActiveTabList = styled.div`
    display: flex;
    flex: 1;
    flex-wrap: wrap;
`
const ActiveTab = styled.div`
    background-color: limegreen;
    color: white;
`
