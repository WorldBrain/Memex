import React, { ChangeEvent } from 'react'
import styled from 'styled-components'
import { darken, lighten } from 'polished'
import styledProps from 'styled-props'
import { ThemeProvider } from 'styled-components'
import { fontSizeSmall } from 'src/common-ui/components/design-library/typography'

interface Props {
    onChange: (value: string) => void
}
export class TagSearchInput extends React.PureComponent<Props> {
    onChange = (e: ChangeEvent<HTMLInputElement>) =>
        this.props.onChange(e.target.value)

    renderActiveTabList() {
        return (
            <ActiveTabList>
                <ActiveTab theme={defaultTagColor}>tag 1</ActiveTab>
                <ActiveTab theme={defaultTagColor}>tag 2</ActiveTab>
            </ActiveTabList>
        )
    }

    render() {
        return (
            <ThemeProvider theme={lightTheme}>
                {this.renderActiveTabList()}
                <SearchInput>
                    <input onChange={this.onChange} />
                </SearchInput>
            </ThemeProvider>
        )
    }
}

// themes should be global to go into a theme file and are referenced from a higher component (even app.js) for now its just here (proof of concept)
const lightTheme = {
    text: '#72727F',
    searchBackground: '#F1F1F5',
}

// a pattern to use so we can add colour variables later
const defaultTagColor = {
    tag: '#83c9f4',
    tagBorder: '#83c9f4',
    tagHover: '#3AB3FF',
    tagSelected: '#E1F2FC',
    tagText: '#083957',
}

// e.g
const otherTagColor = {
    tag: '#44ff88',
    tagBorder: '#83c9f4',
    tagHover: '#83c9f4',
    tagSover: '#83c9f4',
    tagText: '#083957',
}

const SearchInput = styled.div`
    display: flex;
    input {
        background: ${props => props.theme.searchBackground};
        background-color: ${props => props.theme.searchBackground};
        border: 2px solid ${props => props.theme.searchBackground};
        border-radius: 3px;
        background-image: url(/img/search.svg);
        background-position: 8px 50%;
        background-repeat: no-repeat;
        background-size: 20px;
        color: ${props => props.theme.text};
        flex: 1;
        font-size: 1rem;
        padding: 8px 8px 8px 32px;
        transition: border 0.2s;
        &:focus {
            border: 2px solid #e2e2ea;
            outline: none;
        }
    }
`

const ActiveTabList = styled.div`
    display: flex;
    flex: 1;
`

const ActiveTab = styled.div`
    background: ${props => props.theme.tagSelected};
    border: 2px solid ${props => props.theme.tagBorder};
    border-radius: 5px;
    color: ${props => props.theme.tagText};
    padding: 2px 8px;
    margin: 2px 4px 2px 0;
    font-family: 'Poppins', sans-serif;
    font-size: ${fontSizeSmall}px;
`
