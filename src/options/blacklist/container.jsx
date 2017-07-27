import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import BlacklistTable from './components/BlacklistTable'
import BlacklistRow from './components/BlacklistRow'
import BlacklistInputRow from './components/BlacklistInputRow'
import * as actions from './actions'
import { entireState as entireStateSelector } from './selectors'
import * as index from 'src/search/search-index'

class BlacklistContainer extends Component {
    constructor(props) {
        super(props)

        this.state = {
            results: [],
            searchVal: '',
            isStoring: 0,
        }

        this.onNewBlacklistItemAdded = this.onNewBlacklistItemAdded.bind(this)
        this.onInputChange = this.onInputChange.bind(this)
        this.handleInputKeyPress = this.handleInputKeyPress.bind(this)
        this.onSearchChange = this.onSearchChange.bind(this)
        this.onSearchSizeClick = this.onSearchSizeClick.bind(this)
        this.searchStream = this.searchStream.bind(this)
    }

    componentDidMount() {
        this.focusInput()
    }

    storeIndex = async event => {
        this.setState(state => ({ ...state, isStoring: 1 }))

        try {
            console.time('serialize time')
            const res = await index.store()
            console.log(res)
        } catch (error) {
            console.error('cannot serialize index:')
            console.error(error)
        } finally {
            console.timeEnd('serialize time')
            this.setState(state => ({ ...state, isStoring: 0 }))
        }
    }

    restoreIndex = async event => {
        this.setState(state => ({ ...state, isStoring: 2 }))

        try {
            console.time('deserialize time')
            const res = await index.restore()
            console.log(res)
        } catch (error) {
            console.error('cannot deserialize index:')
            console.error(error)
        } finally {
            console.timeEnd('deserialize time')
            this.setState(state => ({ ...state, isStoring: 0 }))
        }
    }

    destroyIndex = async event => {
        try {
            const res = await index.destroy()
            console.log(res)
        } catch (error) {
            console.error(error)
        }
    }

    async onSearchSizeClick(event) {
        try {
            const size = await index.size()
            console.log(`index currently indexes ${size} docs`)
        } catch (error) {
            console.error('cannot fetch index size:')
            console.error(error)
        }
    }

    async search() {
        const query = { AND: { '*': [this.state.searchVal] } }
        let results = []

        try {
            results = await index.find({ query })
        } catch (err) {
            results = [err.message]
        } finally {
            this.setState(state => ({ ...state, results }))
        }
    }

    async searchStream() {
        const query = { AND: { '*': [this.state.searchVal] } }
        const stream = await index.findStream({ query })

        stream.on('data', datum => this.setState(state => ({ ...state, results: [...state.results, datum] })))
    }

    onSearchClick = single => async event => {
        event.preventDefault()
        const query = { AND: { 'title': [this.state.searchVal] } }
        let results = []
        console.time('search time')

        try {
            if (single) {
                results = [await index.findOne({ query })]
            } else {
                results = await index.find({ query })
            }
        } catch (err) {
            results = [err.message]
        } finally {
            console.timeEnd('search time')
            this.setState(state => ({ ...state, results }))
        }
    }

    onSearchChange(event) {
        const searchVal = event.target.value
        this.setState(state => ({ ...state, searchVal }))
    }

    focusInput() {
        this.input.focus()
    }

    shouldDisableSaveBtn() {
        // If there aren't any non-whitespace chars (only need to find first)
        return !/\S/.test(this.props.siteInputValue)
    }

    shouldDisableClearBtn() {
        return this.props.siteInputValue.length === 0
    }

    onNewBlacklistItemAdded() {
        const { boundActions, siteInputValue } = this.props

        // Ignore all whitespace by deleting it
        const whitespaces = /\s+/g
        const expression = siteInputValue.replace(whitespaces, '')

        // Ignore when user tries to submit nothing (no error state, so just do nothing)
        if (expression.length === 0) return

        boundActions.addToBlacklist(expression)

        boundActions.resetSiteInputValue()

        // Make sure input refocuses after new item added
        this.focusInput()
    }

    onDeleteClicked(itemIndex) {
        // TODO(AM): Undo? Confirmation?
        const { boundActions } = this.props

        boundActions.removeSiteFromBlacklist({ index: itemIndex })
    }

    onInputChange(event = { target: {} }) {
        const siteInputValue = event.target.value || ''
        this.props.boundActions.setSiteInputValue({ siteInputValue })
    }

    handleInputKeyPress(event = {}) {
        if (event.key === 'Enter') {
            event.preventDefault()
            this.onNewBlacklistItemAdded()
        }

        if (event.key === 'Escape') {
            event.preventDefault()
            this.input.blur()
        }
    }

    renderBlacklistInputRow() {
        const { boundActions, siteInputValue } = this.props

        return (
            <BlacklistInputRow
                key='blacklist-input'
                value={siteInputValue}
                isClearBtnDisabled={this.shouldDisableClearBtn()}
                isSaveBtnDisabled={this.shouldDisableSaveBtn()}
                onAdd={this.onNewBlacklistItemAdded}
                handleKeyPress={this.handleInputKeyPress}
                onInputChange={this.onInputChange}
                onInputClear={() => boundActions.resetSiteInputValue()}
                inputRef={input => this.input = input}   // eslint-disable-line no-return-assign
            />
        )
    }

    renderBlacklistRows() {
        const { blacklist } = this.props

        return [
            this.renderBlacklistInputRow(),
            ...blacklist.map(({ expression }, idx) => (
                <BlacklistRow
                    key={idx}
                    expression={expression}
                    onDeleteClicked={() => this.onDeleteClicked(idx)}
                />
            )),
        ]
    }

    render() {
        return (
            <BlacklistTable
                onSearchChange={this.onSearchChange}
                onSingleSearchClick={this.onSearchClick(true)}
                onMultiSearchClick={this.onSearchClick(false)}
                onStreamSearchClick={this.searchStream}
                onSearchSizeClick={this.onSearchSizeClick}
                onStoreClick={this.storeIndex}
                onRestoreClick={this.restoreIndex}
                onDestroyClick={this.destroyIndex}
                {...this.state}
            >
                {this.renderBlacklistRows()}
            </BlacklistTable>
        )
    }
}

BlacklistContainer.propTypes = {
    // State
    siteInputValue: PropTypes.string.isRequired,
    blacklist: PropTypes.arrayOf(PropTypes.shape({
        expression: PropTypes.string.isRequired,
    })).isRequired,

    // Misc
    boundActions: PropTypes.objectOf(PropTypes.func),
}

const mapStateToProps = entireStateSelector
const mapDispatchToProps = dispatch => ({ boundActions: bindActionCreators(actions, dispatch) })

export default connect(mapStateToProps, mapDispatchToProps)(BlacklistContainer)
