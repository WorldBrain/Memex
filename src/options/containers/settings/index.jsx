import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import * as actions from './actions'
import Blacklist from '../../components/blacklist'

import { routeTitle, sectionTitle } from '../../base.css'
import styles from './style.css'

class SettingsContainer extends React.Component {
    constructor(props) {
        super(props)

        this.onNewBlacklistItemAdded = this.onNewBlacklistItemAdded.bind(this)
        this.onDeleteClicked = this.onDeleteClicked.bind(this)
        this.onInputChange = this.onInputChange.bind(this)
        this.handleInputKeyPress = this.handleInputKeyPress.bind(this)
    }

    onNewBlacklistItemAdded() {
        // TODO(AM): Validation
        const { boundActions, siteInputValue } = this.props

        boundActions.addSiteToBlacklist({
            expression: siteInputValue,
            dateAdded: new Date()
        })

        boundActions.resetSiteInputValue()
    }

    onDeleteClicked(itemIndex) {
        // TODO(AM): Undo? Confirmation?
        const { boundActions } = this.props

        boundActions.removeSiteFromBlacklist({
            index: itemIndex
        })
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
    }

    render() {
        return (
            <div>
                <h1 className={routeTitle}>Settings</h1>

                <section className={styles.section}>
                    <h2 className={sectionTitle}>Ignored Sites</h2>

                    <Blacklist blacklist={this.props.blacklist}
                               onNewBlacklistItemAdded={this.onNewBlacklistItemAdded}
                               onAddClicked={this.onAddClicked}
                               onDeleteClicked={this.onDeleteClicked}
                               onInputChange={this.onInputChange}
                               handleInputKeyPress={this.handleInputKeyPress}
                               siteInputValue={this.props.siteInputValue} />
                </section>
            </div>
        )
    }
}

SettingsContainer.propTypes = {
    blacklist: PropTypes.array.isRequired,
    siteInputValue: PropTypes.string.isRequired,
    boundActions: PropTypes.objectOf(PropTypes.func),
}

function mapStateToProps({ settings }) {
    return {
        ...settings,
    }
}

function mapDispatchToProps(dispatch) {
    return {
        boundActions: bindActionCreators(actions, dispatch)
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingsContainer)
