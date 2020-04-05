import React, { PureComponent, KeyboardEventHandler } from 'react'
import qs from 'query-string'
import { connect, MapStateToProps } from 'react-redux'
import { browser } from 'webextension-polyfill-ts'

import * as constants from '../constants'
import analytics from '../analytics'
import extractQueryFilters from '../util/nlp-time-filter'
import { remoteFunction } from '../util/webextensionRPC'
import {
    IndexDropdown,
    AddListDropdownContainer,
} from '../common-ui/containers'
import Search from './components/Search'
import LinkButton from './components/LinkButton'
import ButtonIcon from './components/ButtonIcon'
import { TooltipButton } from './tooltip-button'
import { SidebarButton } from './sidebar-button'
import { NotifButton } from './notif-button'
import { HistoryPauser } from './pause-button'
import { selectors as tags, acts as tagActs, TagsButton } from './tags-button'
import {
    selectors as collections,
    acts as collectionActs,
    CollectionsButton,
} from './collections-button'
import {
    selectors as blacklist,
    BlacklistButton,
    BlacklistConfirm,
} from './blacklist-button'
import { BookmarkButton } from './bookmark-button'
import * as selectors from './selectors'
import * as acts from './actions'
import { ClickHandler, RootState } from './types'
import { PageList } from '../custom-lists/background/types'
import { EVENT_NAMES } from '../analytics/internal/constants'

const btnStyles = require('./components/Button.css')
const styles = require('./components/Popup.css')

export interface OwnProps {}

interface StateProps {
    blacklistConfirm: boolean
    showTagsPicker: boolean
    showCollectionsPicker: boolean
    tabId: number
    url: string
    tags: string[]
    collections: PageList[]
    searchValue: string
    initTagSuggs: string[]
    initCollSuggs: PageList[]
    allTabs: boolean
    allTabsCollection: boolean
}

interface DispatchProps {
    initState: () => Promise<void>
    handleSearchChange: ClickHandler<HTMLInputElement>
    toggleShowTagsPicker: () => void
    toggleShowCollectionsPicker: () => void
    onTagAdd: (tag: string) => void
    onTagDel: (tag: string) => void
    onCollectionAdd: (collection: PageList) => void
    onCollectionDel: (collection: PageList) => void
}

export type Props = OwnProps & StateProps & DispatchProps

class PopupContainer extends PureComponent<Props> {
    componentDidMount() {
        this.props.initState()
    }

    processEvent = remoteFunction('processEvent')

    closePopup = () => window.close()

    onSearchEnter: KeyboardEventHandler<HTMLInputElement> = event => {
        if (event.key === 'Enter') {
            event.preventDefault()
            analytics.trackEvent({
                category: 'Search',
                action: 'Popup search',
            })

            this.processEvent({
                type: EVENT_NAMES.SEARCH_POPUP,
            })

            const queryFilters = extractQueryFilters(this.props.searchValue)
            const queryParams = qs.stringify(queryFilters)

            browser.tabs.create({
                url: `${constants.OVERVIEW_URL}?${queryParams}`,
            }) // New tab with query

            this.closePopup()
        }
    }

    renderChildren() {
        if (this.props.blacklistConfirm) {
            return <BlacklistConfirm />
        }

        if (this.props.showTagsPicker) {
            return (
                <IndexDropdown
                    url={this.props.url}
                    tabId={this.props.tabId}
                    initFilters={this.props.tags}
                    initSuggestions={this.props.initTagSuggs}
                    source="tag"
                    onBackBtnClick={this.props.toggleShowTagsPicker}
                    onFilterAdd={this.props.onTagAdd}
                    onFilterDel={this.props.onTagDel}
                    allTabs={this.props.allTabs}
                />
            )
        }

        if (this.props.showCollectionsPicker) {
            return (
                <AddListDropdownContainer
                    mode="popup"
                    initLists={this.props.collections}
                    initSuggestions={this.props.initCollSuggs}
                    url={this.props.url}
                    onBackBtnClick={this.props.toggleShowCollectionsPicker}
                    onFilterAdd={this.props.onCollectionAdd}
                    onFilterDel={this.props.onCollectionDel}
                    allTabsCollection={this.props.allTabsCollection}
                />
            )
        }

        return (
            <React.Fragment>
                <Search
                    searchValue={this.props.searchValue}
                    onSearchChange={this.props.handleSearchChange}
                    onSearchEnter={this.onSearchEnter}
                />
                <div className={styles.item}>
                    <LinkButton
                        btnClass={btnStyles.openIcon}
                        href={`${constants.OPTIONS_URL}#/overview`}
                    >
                        Go to Dashboard
                    </LinkButton>
                </div>
                <hr />
                <div className={styles.item}>
                    <BookmarkButton closePopup={this.closePopup} />
                </div>

                <div className={styles.item}>
                    <TagsButton />
                </div>

                <div className={styles.item}>
                    <CollectionsButton />
                </div>
                <hr />

                <div className={styles.item}>
                    <HistoryPauser />
                </div>

                <div className={styles.item}>
                    <BlacklistButton />
                </div>
                <hr />

                <div className={styles.item}>
                    <SidebarButton closePopup={this.closePopup} />
                </div>

                <div className={styles.item}>
                    <TooltipButton closePopup={this.closePopup} />
                </div>

                <hr />
                <div className={styles.buttonContainer}>
                    <ButtonIcon
                        href={`${constants.OPTIONS_URL}#/settings`}
                        icon="settings"
                        className={btnStyles.settingsIcon}
                        btnClass={btnStyles.settings}
                    />
                    <ButtonIcon
                        href="https://worldbrain.io/help"
                        icon="help"
                        btnClass={btnStyles.help}
                    />
                    {/*<NotifButton />*/}
                </div>
            </React.Fragment>
        )
    }

    render() {
        return <div className={styles.popup}>{this.renderChildren()}</div>
    }
}

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = state => ({
    tabId: selectors.tabId(state),
    url: selectors.url(state),
    searchValue: selectors.searchValue(state),
    blacklistConfirm: blacklist.showDeleteConfirm(state),
    showCollectionsPicker: collections.showCollectionsPicker(state),
    collections: collections.collections(state),
    initCollSuggs: collections.initCollSuggestions(state),
    showTagsPicker: tags.showTagsPicker(state),
    tags: tags.tags(state),
    initTagSuggs: tags.initTagSuggestions(state),
    allTabs: tags.allTabs(state),
    allTabsCollection: collections.allTabs(state),
})

const mapDispatch = (dispatch): DispatchProps => ({
    initState: () => dispatch(acts.initState()),
    handleSearchChange: e => {
        e.preventDefault()
        const input = e.target as HTMLInputElement
        dispatch(acts.setSearchVal(input.value))
    },
    toggleShowTagsPicker: () => dispatch(tagActs.toggleShowTagsPicker()),
    toggleShowCollectionsPicker: () =>
        dispatch(collectionActs.toggleShowTagsPicker()),
    onTagAdd: (tag: string) => dispatch(tagActs.addTagToPage(tag)),
    onTagDel: (tag: string) => dispatch(tagActs.deleteTag(tag)),
    onCollectionAdd: (collection: PageList) =>
        dispatch(collectionActs.addCollectionToPage(collection)),
    onCollectionDel: (collection: PageList) =>
        dispatch(collectionActs.deleteCollection(collection)),
})

export default connect<StateProps, DispatchProps, OwnProps>(
    mapState,
    mapDispatch,
)(PopupContainer)
