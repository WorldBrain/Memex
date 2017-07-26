import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import BlacklistTable from './components/BlacklistTable'
import BlacklistRow from './components/BlacklistRow'
import BlacklistInputRow from './components/BlacklistInputRow'
import * as actions from './actions'
import { entireState as entireStateSelector } from './selectors'

class BlacklistContainer extends Component {
    constructor(props) {
        super(props)

        this.onNewBlacklistItemAdded = this.onNewBlacklistItemAdded.bind(this)
        this.onInputChange = this.onInputChange.bind(this)
        this.handleInputKeyPress = this.handleInputKeyPress.bind(this)
    }

    componentDidMount() {
        this.focusInput()
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
            <BlacklistTable>
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
