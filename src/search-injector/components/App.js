import React, { Component } from 'react'
import PropTypes from 'prop-types'

import Result from './Result'
import BadSearchTerm from './BadSearchTerm'

const styles = {
    searchResultContainer: {
        position: 'relative',
        height: 'var(--height)',
        boxSizing: 'content-box',
        justifyContent: 'space-between',
        overflow: 'hidden',
        marginTop: 'var(--vertical-spacing)',
        border: '1px solid #3eb99517',
        borderRadius: '3px',
        backgroundColor: '#fefefe',
        boxShadow: '0 4px 20px 1px #3eb99517',
        textDecoration: 'node',
        width: '75vw',
        margin: '0 auto',
        padding: '2%',
    },
    heading: {
        color: '#4abf9d',
    },
    showMore: {
        fontSize: '1.5em',
        marginTop: '30px',
        cursor: 'pointer',
        color: '#4abf9d',
    },
}

class App extends Component {
    static propTypes = {
        searchResult: PropTypes.object.isRequired,
        openOverview: PropTypes.func.isRequired,
    }

    renderResultItems() {
        const resultItems = this.props.searchResult.docs.map((doc, i) => (
            <Result key={i} {...doc} />
        ))
        return resultItems
    }

    renderResults() {
        const { searchResult } = this.props
        if (searchResult.isBadTerm) {
            return (
                <BadSearchTerm>
                    This is too common term to be searched.
                </BadSearchTerm>
            )
        } else if (searchResult.docs.length === 0) {
            return <BadSearchTerm>Nothing in you Memex Memory.</BadSearchTerm>
        } else {
            return this.renderResultItems()
        }
    }

    handleShowMoreResults = () => {
        const { resultsExhausted } = this.props.searchResult
        if (!resultsExhausted) {
            return (
                <div style={styles.showMore} onClick={this.props.openOverview}>
                    Show More Results from Memex...
                </div>
            )
        }
    }

    render() {
        return (
            <div style={styles.searchResultContainer}>
                <h2 style={styles.heading}>Search Results from MEMEX.</h2>
                <ul style={{ listStyleType: 'none' }}>
                    {this.renderResults()}
                </ul>
                {this.handleShowMoreResults()}
            </div>
        )
    }
}

export default App
