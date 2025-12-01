import React, { PureComponent, SyntheticEvent } from 'react'

export interface Props {
    searchValue: string
    onSearchEnter: (e: SyntheticEvent<HTMLInputElement>) => void
    onSearchChange: (e: SyntheticEvent<HTMLInputElement>) => void
}

class Search extends PureComponent<Props> {
    render() {
        return (
            <form>
                <span />
                <input
                    autoFocus
                    name="query"
                    placeholder="Search your Memex"
                    autoComplete="off"
                    onKeyDown={this.props.onSearchEnter}
                    onChange={this.props.onSearchChange}
                    value={this.props.searchValue}
                />
            </form>
        )
    }
}

export default Search
