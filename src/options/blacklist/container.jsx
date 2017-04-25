import React, { PropTypes, Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import Blacklist from './components/Blacklist'
import * as actions from './actions'

class BlacklistContainer extends Component {
    constructor(props) {
        super(props)

        this.onNewBlacklistItemAdded = this.onNewBlacklistItemAdded.bind(this)
        this.onDeleteClicked = this.onDeleteClicked.bind(this)
        this.onInputChange = this.onInputChange.bind(this)
        this.handleInputKeyPress = this.handleInputKeyPress.bind(this)
    }

    componentDidMount() {
        this.focusInput()
    }

    focusInput() {
        this.input.focus()
    }

    onNewBlacklistItemAdded() {
        const { boundActions, siteInputValue } = this.props

        // Ignore all whitespace by deleting it
        const whitespaces = /\s+/g
        const expression = siteInputValue.replace(whitespaces, '')

        // Ignore when user tries to submit nothing (no error state, so just do nothing)
        if (expression.length === 0) return

        boundActions.addSiteToBlacklist({
            expression,
            dateAdded: new Date(),
        })

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

    render() {
        const { boundActions } = this.props

        return (
            <Blacklist blacklist={this.props.blacklist}
                onNewBlacklistItemAdded={this.onNewBlacklistItemAdded}
                onInputClear={() => boundActions.resetSiteInputValue()}
                onAddClicked={this.onAddClicked}
                onDeleteClicked={this.onDeleteClicked}
                onInputChange={this.onInputChange}
                handleInputKeyPress={this.handleInputKeyPress}
                siteInputValue={this.props.siteInputValue}
                inputRef={input => this.input = input} />   // eslint-disable-line no-return-assign
        )
    }
}

BlacklistContainer.propTypes = {
    blacklist: PropTypes.array.isRequired,
    siteInputValue: PropTypes.string.isRequired,
    boundActions: PropTypes.objectOf(PropTypes.func),
}

const mapStateToProps = ({ blacklist }) => blacklist
const mapDispatchToProps = dispatch => ({ boundActions: bindActionCreators(actions, dispatch) })

export default connect(mapStateToProps, mapDispatchToProps)(BlacklistContainer)
