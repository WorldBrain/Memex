import React from 'react'
import PropTypes from 'prop-types'

import { remoteFunction } from 'src/util/webextensionRPC'
import Results from './Results'
import ResultItem from './ResultItem'
import RemovedText from './RemovedText'
import * as constants from '../constants'
import { getLocalStorage, setLocalStorage } from '../utils'
import { MigrationNotice } from '../../common-ui/containers'
import Notification from './Notification'
import { SEARCH_ENGINE_NOTIF } from '../../notifications/notifications'
import * as actionTypes from '../../notifications/action-types'
import { actionRegistry } from '../../notifications/registry'
import ActionButton from '../../notifications/components/ActionButton'
import OptIn from '../../notifications/components/OptIn'
import OpenLinkButton from '../../notifications/components/OpenLinkButton'
import { ToggleSwitch } from '../../common-ui/components'

class Container extends React.Component {
    static propTypes = {
        results: PropTypes.arrayOf(PropTypes.object).isRequired,
        len: PropTypes.number.isRequired,
        rerender: PropTypes.func.isRequired,
        searchEngine: PropTypes.string.isRequired,
        requiresMigration: PropTypes.bool.isRequired,
    }

    constructor(props) {
        super(props)
        this.renderResultItems = this.renderResultItems.bind(this)
        this.seeMoreResults = this.seeMoreResults.bind(this)
        this.toggleHideResults = this.toggleHideResults.bind(this)
        this.toggleDropdown = this.toggleDropdown.bind(this)
        this.closeDropdown = this.closeDropdown.bind(this)
        this.removeResults = this.removeResults.bind(this)
        this.undoRemove = this.undoRemove.bind(this)
        this.changePosition = this.changePosition.bind(this)
        this.handleClickTick = this.handleClickTick.bind(this)

        this.updateLastActive = remoteFunction('updateLastActive')
        this.trackEvent = remoteFunction('trackEvent')
        this.readNotification = remoteFunction('readNotification')
        this.fetchNotifById = remoteFunction('fetchNotifById')
    }

    state = {
        hideResults: true,
        dropdown: false,
        removed: false,
        position: null,
        isNotif: true,
    }

    async componentDidMount() {
        const hideResults = await getLocalStorage(
            constants.HIDE_RESULTS_KEY,
            false,
        )
        const position = await getLocalStorage(constants.POSITION_KEY, 'side')
        const fetchNotif = await this.fetchNotifById(SEARCH_ENGINE_NOTIF.id)

        this.setState({
            hideResults,
            position,
            isNotif: !fetchNotif.readTime,
        })
    }

    handleResultLinkClick = () => this.updateLastActive()

    renderResultItems() {
        const resultItems = this.props.results.map((result, i) => (
            <ResultItem
                key={i}
                onLinkClick={this.handleResultLinkClick}
                searchEngine={this.props.searchEngine}
                {...result}
            />
        ))
        return resultItems
    }

    seeMoreResults() {
        this.updateLastActive()
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

    toggleDropdown() {
        this.setState(state => ({
            ...state,
            dropdown: !state.dropdown,
        }))
    }

    closeDropdown() {
        this.setState({
            dropdown: false,
        })
    }

    /**
     * Handles persisting the enabled (removed) state for current search engine, without affecting other
     * search engine preferences.
     *
     * @param {boolean} isEnabled
     */
    async _persistEnabledChange(isEnabled) {
        const prevState = await getLocalStorage(
            constants.SEARCH_INJECTION_KEY,
            constants.SEARCH_INJECTION_DEFAULT,
        )

        await setLocalStorage(constants.SEARCH_INJECTION_KEY, {
            ...prevState,
            [this.props.searchEngine]: isEnabled,
        })
    }

    async removeResults() {
        // Sets the search injection key to false
        // And sets removed state to true
        // Triggering the Removed text UI to pop up
        await this._persistEnabledChange(false)

        this.trackEvent({
            category: 'Search integration',
            action: 'Disabled',
            name: 'Content script',
        })

        this.setState({
            removed: true,
            dropdown: false,
        })
    }

    async undoRemove() {
        await this._persistEnabledChange(true)

        this.setState({ removed: false })
    }

    async changePosition() {
        const currPos = this.state.position
        const newPos = currPos === 'above' ? 'side' : 'above'
        await setLocalStorage(constants.POSITION_KEY, newPos)
        this.props.rerender()
    }

    async handleClickTick() {
        await this.readNotification(SEARCH_ENGINE_NOTIF.id)
        console.log('Here')

        this.setState({
            isNotif: false,
        })
    }

    handleToggleStorageOption(action, value) {
        action = {
            ...action,
            value,
        }

        actionRegistry[action.type]({
            definition: action,
        })
    }

    renderButton() {
        const { button } = SEARCH_ENGINE_NOTIF
        const { action } = button

        console.log(action)

        if (action.type === actionTypes.OPEN_URL) {
            return (
                <OpenLinkButton
                    url={action.url}
                    label={button.label}
                    context={action.context}
                />
            )
        } else if (action.type === actionTypes.TOGGLE_SETTING) {
            return (
                <OptIn>
                    <ToggleSwitch
                        defaultValue
                        onChange={val =>
                            this.handleToggleStorageOption(action, val)
                        }
                    />
                </OptIn>
            )
        } else {
            return (
                <ActionButton
                    handleClick={actionRegistry[action.type]({
                        definition: action,
                    })}
                >
                    {button.label}
                </ActionButton>
            )
        }
    }

    renderNotification() {
        const { isNotif } = this.state

        if (!isNotif) {
            return null
        }

        return (
            <Notification
                title={SEARCH_ENGINE_NOTIF.title}
                message={SEARCH_ENGINE_NOTIF.message}
                button={this.renderButton()}
                handleTick={this.handleClickTick}
            />
        )
    }

    render() {
        if (this.props.requiresMigration) {
            return <MigrationNotice showBanner />
        }

        // If the state.removed is true, show the RemovedText component
        if (this.state.removed) {
            return (
                <RemovedText
                    undo={this.undoRemove}
                    position={this.state.position}
                />
            )
        }

        if (!this.state.position) {
            return null
        }

        return (
            <Results
                position={this.state.position}
                searchEngine={this.props.searchEngine}
                totalCount={this.props.len}
                seeMoreResults={this.seeMoreResults}
                toggleHideResults={this.toggleHideResults}
                hideResults={this.state.hideResults}
                toggleDropdown={this.toggleDropdown}
                closeDropdown={this.closeDropdown}
                dropdown={this.state.dropdown}
                removeResults={this.removeResults}
                changePosition={this.changePosition}
                renderResultItems={this.renderResultItems}
                renderNotification={this.renderNotification()}
            />
        )
    }
}

export default Container
