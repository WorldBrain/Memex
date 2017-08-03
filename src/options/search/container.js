import React, { Component } from 'react'

import Search from './components/Search'
import * as index from 'src/search/search-index'
import QueryBuilder from 'src/search/query-builder'

class SearchContainer extends Component {
    state = {
        results: [],
        searchVal: '',
    }

    destroyIndex = async event => {
        try {
            const res = await index.destroy()
            console.log(res)
        } catch (error) {
            console.error(error)
        }
    }

    onSearchSizeClick = async event => {
        try {
            const size = await index.size()
            console.log(`index currently indexes ${size} docs`)
        } catch (error) {
            console.error('cannot fetch index size:')
            console.error(error)
        }
    }

    searchStream = async () => {
        const query = new QueryBuilder()
            .searchTerm(this.state.searchVal)
            .get()
        const stream = await index.findStream(query)

        stream.on('data', datum => this.setState(state => ({ ...state, results: [...state.results, datum] })))
    }

    onSearchClick = single => async event => {
        event.preventDefault()
        const query = new QueryBuilder()
            .searchTerm(this.state.searchVal)
            .get()
        let results = []
        console.time('search time')

        try {
            if (single) {
                results = [await index.findOne(query)]
            } else {
                results = await index.filterVisitsByQuery({
                    query: this.state.searchVal,

                })
            }
        } catch (err) {
            console.error(err)
            results = [err.message]
        } finally {
            console.timeEnd('search time')
            this.setState(state => ({ ...state, results }))
        }
    }

    onSearchChange = event => {
        const searchVal = event.target.value
        this.setState(state => ({ ...state, searchVal }))
    }

    renderResults() {
        return this.state.results.map((res, i) => (
            <li key={i}>
                <p>{JSON.stringify(res, null, '\t')}</p>
            </li>
        ))
    }

    render() {
        return (
            <Search
                onSearchChange={this.onSearchChange}
                onSingleSearchClick={this.onSearchClick(true)}
                onMultiSearchClick={this.onSearchClick(false)}
                onStreamSearchClick={this.searchStream}
                onSearchSizeClick={this.onSearchSizeClick}
                onStoreClick={this.storeIndex}
                onRestoreClick={this.restoreIndex}
                onDestroyClick={this.destroyIndex}
                searchVal={this.state.searchVal}
            >
                {this.renderResults()}
            </Search>
        )
    }
}

export default SearchContainer
