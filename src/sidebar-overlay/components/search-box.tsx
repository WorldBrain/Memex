import React, { PureComponent, SyntheticEvent } from 'react'
import { ClickHandler } from '../types'
import CloseButton from './close-button'
import Search from 'src/popup/components/Search'

const styles = require('./search-box.css')

export interface Props {
    searchValue: string
    onSearchEnter?: (e: SyntheticEvent<HTMLInputElement>) => void
    onSearchChange?: (e: SyntheticEvent<HTMLInputElement>) => void
    onClearBtn?: ClickHandler<HTMLElement>
}

class SearchBox extends PureComponent<Props> {
    render() {
        return (
            <form className={styles.formContainer}>
                <button className={styles.button}>
                    <span className={styles.searchIcon} />
                </button>
                <input
                    autoFocus
                    className={styles.inputBox}
                    name="query"
                    placeholder="Search Memex (confirm with ENTER)"
                    autoComplete="off"
                    onKeyDown={this.props.onSearchEnter}
                    onChange={this.props.onSearchChange}
                    value={this.props.searchValue}
                />
                {this.props.searchValue && (
                    <CloseButton
                        clickHandler={this.props.onClearBtn}
                        title={'Clear search'}
                    />
                )}
            </form>
        )
    }
}

export default SearchBox
