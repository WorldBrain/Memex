import React, { PureComponent, SyntheticEvent } from 'react'

const styles = require('./Popup.css')

export interface Props {
    searchValue: string
    onSearchEnter: (e: SyntheticEvent<HTMLInputElement>) => void
    onSearchChange: (e: SyntheticEvent<HTMLInputElement>) => void
}

class Search extends PureComponent<Props> {
    render() {
        return (
            <form className={styles.searchContainer}>
                <input
                    autoFocus
                    className={styles.search}
                    name="query"
                    placeholder="Enter keywords"
                    autoComplete="off"
                    onKeyDown={this.props.onSearchEnter}
                    onChange={this.props.onSearchChange}
                    value={this.props.searchValue}
                />
                <i className="material-icons">search</i>
            </form>
        )
    }
}

export default Search
