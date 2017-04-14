import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import debounce from 'lodash/debounce'

import * as actions from './actions'
import Blacklist from '../../components/blacklist'

import { routeTitle, sectionTitle } from '../../base.css'
import styles from './style.css'

class SettingsContainer extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            isAddingEnabled: false
        }

        this.onAddClicked = debounce(this.onAddClicked.bind(this), 100)
        this.onCancelAdding = this.onCancelAdding.bind(this)
        this.onNewBlacklistItemAdded = this.onNewBlacklistItemAdded.bind(this)
        this.onDeleteClicked = this.onDeleteClicked.bind(this)
        this.onInputChange = this.onInputChange.bind(this)
    }

    onAddClicked() {
        this.setState({ isAddingEnabled: true })
    }

    onCancelAdding() {
        this.setState({ isAddingEnabled: false })
    }

    onNewBlacklistItemAdded() {
        // TODO(AM): Validation
        const { actions, siteInputValue } = this.props

        actions.addSiteToBlacklist({
            expression: siteInputValue,
            dateAdded: new Date()
        })
    }

    onDeleteClicked(itemIndex) {
        // TODO(AM): Undo? Confirmation?
        const { actions } = this.props

        actions.removeSiteFromBlacklist({
            index: itemIndex
        })
    }

    onInputChange(event = { target: {} }) {
        const siteInputValue = event.target.value || ''
        this.props.actions.setSiteInputValue({ siteInputValue })
    }

    render() {
        return (
            <div>
                <h1 className={routeTitle}>Settings</h1>

                <section className={styles.section}>
                    <h2 className={sectionTitle}>Ignored Sites</h2>

                    <Blacklist blacklist={this.props.blacklist}
                               isAddingEnabled={this.state.isAddingEnabled}
                               onNewBlacklistItemAdded={this.onNewBlacklistItemAdded}
                               onAddClicked={this.onAddClicked}
                               onCancelAdding={this.onCancelAdding}
                               onDeleteClicked={this.onDeleteClicked}
                               onInputChange={this.onInputChange}
                               siteInputValue={this.props.siteInputValue} />
                </section>
            </div>
        )
    }
}

SettingsContainer.propTypes = {
    blacklist: PropTypes.array.isRequired,
    siteInputValue: PropTypes.string.isRequired,
}

function mapStateToProps({ settings }) {
    return {
        ...settings,
    }
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(actions, dispatch)
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingsContainer)
