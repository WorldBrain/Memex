import React, { PureComponent } from 'react'
import styled from 'styled-components'

import Margin from 'src/dashboard-refactor/components/Margin'
import { Icon } from 'src/dashboard-refactor/styled-components'
import { fonts } from 'src/dashboard-refactor/styles'

const Container = styled.div`
    height: 23px;
    width: 100%;
    background-color: #fff;
    border-radius: 3px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
`

const Input = styled.input`
    font-family: ${fonts.primary.name};
    font-weight: ${fonts.primary.weight.normal};
    color: ${fonts.primary.colors.primary};
    border: none;
    cursor: text;
`

const IconContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
`

const StyledIcon = styled(Icon)`
    color: #3a2f45;
`
export interface ListsSidebarSearchBarProps {
    isSearchBarFocused: boolean
    searchQuery?: string
    onListsSidebarSearchBarFocus(): void
    onListsSidebarSearchBarInputChange(): void
    onListsSidebarSearchBarSubmit(): void
}

export default class ListsSidebarSearchBar extends PureComponent<
    ListsSidebarSearchBarProps
> {
    render(): JSX.Element {
        const {
            searchQuery,
            isSearchBarFocused,
            onListsSidebarSearchBarFocus,
            onListsSidebarSearchBarInputChange,
            onListsSidebarSearchBarSubmit,
        } = this.props
        return (
            <Container onClick={onListsSidebarSearchBarFocus}>
                <IconContainer>
                    <Margin horizontal="12px">
                        <StyledIcon
                            heightAndWidth="12px"
                            path="/img/searchIcon.svg"
                        />
                    </Margin>
                </IconContainer>
                <form onSubmit={onListsSidebarSearchBarSubmit}>
                    <Input
                        onChange={onListsSidebarSearchBarInputChange}
                        value={
                            isSearchBarFocused
                                ? searchQuery
                                : 'Search or add collection'
                        }
                    />
                    <button type="submit" hidden></button>
                </form>
            </Container>
        )
    }
}
