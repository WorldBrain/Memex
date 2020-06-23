import React, { Component, SyntheticEvent } from 'react'
import { ClickHandler } from '../types'
import CloseButton from './close-button'
import TextInputControlled from 'src/common-ui/components/TextInputControlled'

const styles = require('./search-box.css')

export interface SearchBoxProps {
    searchValue: string
    placeholder: string
    onSearchEnter?: (e: SyntheticEvent<HTMLInputElement>) => void
    onSearchChange?: (searchQuery: string) => void
    onSearchClearBtn?: ClickHandler<HTMLElement>
}

class SearchBox extends Component<SearchBoxProps> {
    render() {
        return (
            <div className={styles.formContainer}>
                <button className={styles.button}>
                    <span className={styles.searchIcon} />
                </button>
                <TextInputControlled
                    autoFocus
                    className={styles.inputBox}
                    name="query"
                    placeholder={this.props.placeholder}
                    autoComplete="off"
                    onChange={this.props.onSearchChange}
                    specialHandlers={[
                        {
                            test: (e) => e.key === 'Enter',
                            handle: this.props.onSearchEnter,
                        },
                    ]}
                    defaultValue={this.props.searchValue}
                    type={'input'}
                />
                {this.props.searchValue && (
                    <CloseButton
                        clickHandler={this.props.onSearchClearBtn}
                        title={'Clear search'}
                    />
                )}
            </div>
        )
    }
}

export default SearchBox
