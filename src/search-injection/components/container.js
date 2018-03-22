import React from 'react'
import PropTypes from 'prop-types'

import Results from './Results'
import ResultItem from './ResultItem'
import RemovedText from './RemovedText'
import * as constants from '../constants'
import { getLocalStorage, setLocalStorage } from '../utils'

class Container extends React.Component {
    static propTypes = {
        results: PropTypes.arrayOf(PropTypes.object).isRequired,
        len: PropTypes.number.isRequired,
        rerender: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props)
        this.renderResultItems = this.renderResultItems.bind(this)
        this.seeMoreResults = this.seeMoreResults.bind(this)
        this.toggleHideResults = this.toggleHideResults.bind(this)
        this.toggleDropDown = this.toggleDropDown.bind(this)
        this.removeResults = this.removeResults.bind(this)
        this.undoRemove = this.undoRemove.bind(this)
        this.changePosition = this.changePosition.bind(this)
    }

    state = {
        hideResults: true,
        dropdown: false,
        removed: false,
        position: null,
    }

    async componentDidMount() {
        const hideResults = await getLocalStorage(
            constants.HIDE_RESULTS_KEY,
            false,
        )
        const position = await getLocalStorage(constants.POSITION_KEY, 'above')
        this.setState({
            hideResults,
            position,
        })
    }

    renderResultItems() {
        const resultItems = this.props.results.map((result, i) => (
            <ResultItem key={i} {...result} />
        ))
        return resultItems
    }

    seeMoreResults() {
        // Create a new tab with the query overview URL
        const query = new URL(location.href).searchParams.get('q')

        const message = {
            action: constants.OPEN_OVERVIEW,
            query,
        }
        browser.runtime.sendMessage(message)
    }

    async toggleHideResults() {
        // Toggles hideResults (minimize) state
        // And also, sets dropdown to false
        const toggled = !this.state.hideResults
        await setLocalStorage(constants.HIDE_RESULTS_KEY, toggled)
        this.setState({
            hideResults: toggled,
            dropdown: false,
        })
    }

    toggleDropDown() {
        this.setState(state => ({
            ...state,
            dropdown: !state.dropdown,
        }))
    }

    async removeResults() {
        // Sets the search injection key to false
        // And sets removed state to true
        // Triggering the Removed text UI to pop up
        await setLocalStorage(constants.SEARCH_INJECTION_KEY, false)
        this.setState({
            removed: true,
            dropdown: false,
        })
    }

    async undoRemove() {
        await setLocalStorage(constants.SEARCH_INJECTION_KEY, true)
        this.setState({
            removed: false,
        })
    }

    async changePosition() {
        const currPos = this.state.position
        const newPos = currPos === 'above' ? 'side' : 'above'
        await setLocalStorage(constants.POSITION_KEY, newPos)
        this.props.rerender()
    }

    render() {
        // If the state.removed is true, show the RemovedText component
        if (this.state.removed) return <RemovedText undo={this.undoRemove} />

        const { position } = this.state
        if (!position) {
            return null
        }

        return (
            <Results 
                position={position}
                totalCount={this.props.len}
                seeMoreResults={this.seeMoreResults}
                toggleHideResults={this.toggleHideResults}
                hideResults={this.state.hideResults}
                toggleDropDown={this.toggleDropDown}
                dropdown={this.state.dropdown}
                removeResults={this.removeResults}
                changePosition={this.changePosition}
                renderResultItems={this.renderResultItems} 
            />
        )

    }
}

export default Container
