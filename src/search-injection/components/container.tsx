import React from 'react'
import PropTypes from 'prop-types'

import { remoteFunction } from 'src/util/webextensionRPC'
import Results from './Results'
import strictUriEncode from 'strict-uri-encode'
import ResultItem from './ResultItem'
import RemovedText from './RemovedText'
import * as constants from '../constants'
import { getLocalStorage, setLocalStorage } from '../utils'
import Notification from './Notification'
import { UPDATE_NOTIFS } from '../../notifications/notifications'
import * as actionTypes from '../../notifications/action-types'
import { actionRegistry } from '../../notifications/registry'
import ActionButton from '../../notifications/components/ActionButton'
import OptIn from '../../notifications/components/OptIn'
import { ToggleSwitch } from '../../common-ui/components'
import { EVENT_NAMES } from '../../analytics/internal/constants'

class Container extends React.Component<any, any> {
    static propTypes = {
        results: PropTypes.arrayOf(PropTypes.object).isRequired,
        len: PropTypes.number.isRequired,
        rerender: PropTypes.func.isRequired,
        searchEngine: PropTypes.string.isRequired,
    }

    trackEvent: any
    readNotification: any
    fetchNotifById: any
    processEvent: any
    openOverviewRPC: any

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
        this.trackEvent = remoteFunction('trackEvent')
        this.readNotification = remoteFunction('readNotification')
        this.fetchNotifById = remoteFunction('fetchNotifById')
        this.processEvent = remoteFunction('processEvent')
        this.openOverviewRPC = remoteFunction('openOverviewTab')
    }

    state: any = {
        hideResults: true,
        dropdown: false,
        removed: false,
        position: null,
        isNotif: true,
        notification: {},
    }

    async componentDidMount() {
        let notification

        for (const notif of UPDATE_NOTIFS) {
            if (notif.search) {
                notification = {
                    ...notif.search,
                    id: notif.id,
                }
            }
        }

        const hideResults = await getLocalStorage(
            constants.HIDE_RESULTS_KEY,
            false,
        )
        const position = await getLocalStorage(constants.POSITION_KEY, 'side')

        let fetchNotif
        if (notification) {
            fetchNotif = await this.fetchNotifById(notification.id)
        }

        this.setState({
            hideResults,
            position,
            isNotif: fetchNotif && !fetchNotif.readTime,
            notification,
        })
    }

    handleResultLinkClick = () =>
        this.processEvent({
            type: EVENT_NAMES.CLICK_RESULT_LINK,
        })

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
        // Create a new tab with the query overview URL
        const query = new URL(location.href).searchParams.get('q')
        const finalQuery = strictUriEncode(query)

        this.openOverviewRPC('query=' + finalQuery)
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

    async handleClickTick() {
        this.processEvent({
            type: EVENT_NAMES.READ_NOTIFICATION_SEARCH_ENGINE,
            details: {
                notificationId: this.state.notification.id,
            },
        })

        await this.readNotification(this.state.notification.id)

        this.setState({
            isNotif: false,
        })
    }

    handleToggleStorageOption(action, value) {
        this.processEvent({
            type: EVENT_NAMES.TOGGLE_STORAGE_SEARCH_ENGINE,
            details: {
                notificationId: this.state.notification.id,
            },
        })

        action = {
            ...action,
            value,
        }

        actionRegistry[action.type]({
            definition: action,
        })
    }

    handleClickOpenNewTabButton(url) {
        this.processEvent({
            type: EVENT_NAMES.CLICK_OPEN_NEW_LINK_BUTTON_SEARCH,
            details: {
                notificationId: this.state.notification.id,
            },
        })

        window.open(url, '_blank').focus()
    }

    renderButton() {
        const { buttons } = this.state.notification
        const { action } = buttons[0]

        if (action.type === actionTypes.OPEN_URL) {
            return (
                <ActionButton
                    handleClick={() =>
                        this.handleClickOpenNewTabButton(action.url)
                    }
                    fromSearch
                >
                    {' '}
                    {buttons[0].label}{' '}
                </ActionButton>
            )
        } else if (action.type === actionTypes.TOGGLE_SETTING) {
            return (
                <OptIn fromSearch label={buttons[0].label}>
                    <ToggleSwitch
                        defaultValue
                        onChange={val =>
                            this.handleToggleStorageOption(action, val)
                        }
                        fromSearch
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
                    {' '}
                    {buttons[0].label}{' '}
                </ActionButton>
            )
        }
    }

    renderNotification() {
        const { isNotif } = this.state

        if (!isNotif || !this.state.notification.id) {
            return null
        }

        return (
            <Notification
                title={this.state.notification.title}
                message={this.state.notification.message}
                button={this.renderButton()}
                handleTick={this.handleClickTick}
            />
        )
    }

    render() {
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
