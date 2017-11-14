import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { Wrapper } from 'src/common-ui/components'
import BlacklistTable from './components/BlacklistTable'
import BlacklistRow from './components/BlacklistRow'
import BlacklistInputRow from './components/BlacklistInputRow'
import BlacklistRemoveModal from './components/BlacklistRemoveModal'
import * as actions from './actions'
import * as selectors from './selectors'
import styles from './components/base.css'

class BlacklistContainer extends Component {
    static propTypes = {
        // State
        siteInputValue: PropTypes.string.isRequired,
        lastValue: PropTypes.string,
        blacklist: PropTypes.arrayOf(PropTypes.string).isRequired,
        isInputRegexInvalid: PropTypes.bool.isRequired,
        isSaveBtnDisabled: PropTypes.bool.isRequired,
        isClearBtnDisabled: PropTypes.bool.isRequired,
        showRemoveModal: PropTypes.bool.isRequired,
        isRemoving: PropTypes.bool.isRequired,

        // Misc
        toggleModalShow: PropTypes.func.isRequired,
        removeMatchingDocs: PropTypes.func.isRequired,
        boundActions: PropTypes.objectOf(PropTypes.func),
    }

    componentDidMount() {
        this.focusInput()
    }

    focusInput = () => this.input.focus()
    assignRef = input => (this.input = input)

    onNewBlacklistItemAdded = () => {
        // Make sure to interpret '.' as "period" rather than "any single character", as it is common in hostnames
        // also ignore all whitespace
        const expression = this.props.siteInputValue
            .replace(/\s+/g, '')
            .replace('.', '\\.')

        // Ignore when user tries to submit nothing (no error state, so just do nothing)
        if (!expression.length) return

        this.props.boundActions.addToBlacklist(expression)

        // Make sure input refocuses after new item added
        this.focusInput()
    }

    // TODO(AM): Undo? Confirmation?
    onDeleteClicked = itemIndex => () =>
        this.props.boundActions.removeSiteFromBlacklist({ index: itemIndex })

    onInputChange = (event = { target: {} }) => {
        const siteInputValue = event.target.value || ''
        this.props.boundActions.setSiteInputValue({ siteInputValue })
    }

    /**
     * Handles removing all matching docs from the DBs for the recently added blacklist entry.
     */
    handleRemoveMatching = () =>
        this.props.removeMatchingDocs(this.props.lastValue)

    renderBlacklistInputRow() {
        const { boundActions, siteInputValue, ...props } = this.props

        return (
            <BlacklistInputRow
                key="blacklist-input"
                value={siteInputValue}
                onAdd={this.onNewBlacklistItemAdded}
                onInputChange={this.onInputChange}
                onInputClear={boundActions.resetSiteInputValue}
                inputRef={this.assignRef} // eslint-disable-line no-return-assign
                {...props}
            />
        )
    }

    renderBlacklistRows = () =>
        this.props.blacklist.map((expression, i) => (
            <BlacklistRow
                key={i}
                expression={expression}
                onDeleteClicked={this.onDeleteClicked(i)}
            />
        ))

    renderAddDomain = () => (
        <div className={styles.ignoreDomainText}>Ignore a new domain/url:</div>
    )

    renderAddBlacklistSites = () =>
        this.props.blacklist.length ? (
            <div className={styles.blacklistText}>
                You are currently not indexing ANY visits on URLs that have the
                following text in them:
            </div>
        ) : (
            false
        )

    renderInvalidRegexAlert = () =>
        this.props.isInputRegexInvalid ? (
            <div className={styles.blacklistAlert}>
                This is an invalid RegExp! You can test your regex{' '}
                <a target="_blank" href="https://regexr.com/">
                    here
                </a>
            </div>
        ) : (
            false
        )

    render() {
        return (
            <Wrapper>
                <div>
                    {this.renderAddDomain()}
                    {this.renderInvalidRegexAlert()}
                    {this.renderBlacklistInputRow()}
                    {this.renderAddBlacklistSites()}
                    <BlacklistTable>
                        {this.renderBlacklistRows()}
                    </BlacklistTable>
                </div>
                <BlacklistRemoveModal
                    isRemoving={this.props.isRemoving}
                    isShown={this.props.showRemoveModal}
                    onCancel={this.props.toggleModalShow}
                    onConfirm={this.handleRemoveMatching}
                />
            </Wrapper>
        )
    }
}

const mapStateToProps = state => ({
    siteInputValue: selectors.siteInputValue(state),
    blacklist: selectors.normalizedBlacklist(state),
    isInputRegexInvalid: selectors.isInputRegexInvalid(state),
    isSaveBtnDisabled: selectors.isSaveBtnDisabled(state),
    isClearBtnDisabled: selectors.isClearBtnDisabled(state),
    isRemoving: selectors.isRemoving(state),
    showRemoveModal: selectors.showRemoveModal(state),
    lastValue: selectors.lastValue(state),
})

const mapDispatchToProps = dispatch => ({
    boundActions: bindActionCreators(actions, dispatch),
    toggleModalShow: () => dispatch(actions.toggleModal()),
    removeMatchingDocs: expression =>
        dispatch(actions.removeMatchingDocs(expression)),
})

export default connect(mapStateToProps, mapDispatchToProps)(BlacklistContainer)
