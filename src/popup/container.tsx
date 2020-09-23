import React, { PureComponent, KeyboardEventHandler } from 'react'
import qs from 'query-string'
import { connect, MapStateToProps } from 'react-redux'
import { browser } from 'webextension-polyfill-ts'
import styled from 'styled-components'

import * as constants from '../constants'
import analytics from '../analytics'
import extractQueryFilters from '../util/nlp-time-filter'
import { remoteFunction } from '../util/webextensionRPC'
import Search from './components/Search'
import LinkButton from './components/LinkButton'
import ButtonIcon from './components/ButtonIcon'
import { TooltipButton } from './tooltip-button'
import { SidebarButton } from './sidebar-button'
import { HistoryPauser } from './pause-button'
import { ButtonTooltip } from 'src/common-ui/components'
import {
    selectors as tagsSelectors,
    acts as tagActs,
    TagsButton,
} from './tags-button'
import {
    selectors as collectionsSelectors,
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
import { EVENT_NAMES } from '../analytics/internal/constants'
import CollectionPicker from 'src/custom-lists/ui/CollectionPicker'
import TagPicker from 'src/tags/ui/TagPicker'
import { tags, collections } from 'src/util/remote-functions-background'
import { BackContainer } from 'src/popup/components/BackContainer'
const btnStyles = require('./components/Button.css')
const styles = require('./components/Popup.css')
import * as icons from 'src/common-ui/components/design-library/icons'

export interface OwnProps {}

interface StateProps {
    blacklistConfirm: boolean
    showTagsPicker: boolean
    showCollectionsPicker: boolean
    tabId: number
    url: string
    searchValue: string
}

interface DispatchProps {
    initState: () => Promise<void>
    handleSearchChange: ClickHandler<HTMLInputElement>
    toggleShowTagsPicker: () => void
    toggleShowCollectionsPicker: () => void
    onTagAdd: (tag: string) => void
    onTagDel: (tag: string) => void
    onCollectionAdd: (collection: string) => void
    onCollectionDel: (collection: string) => void
}

export type Props = OwnProps & StateProps & DispatchProps

class PopupContainer extends PureComponent<Props> {
    componentDidMount() {
        analytics.trackEvent({
            category: 'Global',
            action: 'openPopup',
        })
        this.props.initState()
    }

    processEvent = remoteFunction('processEvent')

    closePopup = () => window.close()

    onSearchEnter: KeyboardEventHandler<HTMLInputElement> = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault()
            analytics.trackEvent({
                category: 'Search',
                action: 'searchViaPopup',
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

    handleTagUpdate = async ({ added, deleted }) => {
        const backendResult = tags.updateTagForPage({
            added,
            deleted,
            url: this.props.url,
        })
        // Redux actions
        if (added) {
            this.props.onTagAdd(added)
        }
        if (deleted) {
            return this.props.onTagDel(deleted)
        }
        return backendResult
    }

    handleTagAllTabs = (tagName: string) =>
        tags.addTagsToOpenTabs({ name: tagName })
    handleTagQuery = (query: string) => tags.searchForTagSuggestions({ query })
    fetchTagsForPage = async () => tags.fetchPageTags({ url: this.props.url })

    handleListUpdate = async ({ added, deleted }) => {
        const backendResult = collections.updateListForPage({
            added,
            deleted,
            url: this.props.url,
        })
        // Redux actions
        if (added) {
            this.props.onCollectionAdd(added)
        }
        if (deleted) {
            return this.props.onCollectionDel(deleted)
        }
        return backendResult
    }

    handleListAllTabs = (listName: string) =>
        collections.addOpenTabsToList({ name: listName })
    handleListQuery = (query: string) =>
        collections.searchForListSuggestions({ query })
    fetchListsForPage = async () =>
        collections.fetchPageLists({ url: this.props.url })

    renderChildren() {
        if (this.props.blacklistConfirm) {
            return <BlacklistConfirm />
        }

        if (this.props.showTagsPicker) {
            return (
                <TagPicker
                    queryEntries={this.handleTagQuery}
                    onUpdateEntrySelection={this.handleTagUpdate}
                    initialSelectedEntries={this.fetchTagsForPage}
                    actOnAllTabs={this.handleTagAllTabs}
                    loadDefaultSuggestions={tags.fetchInitialTagSuggestions}
                >
                    <BackContainer onClick={this.props.toggleShowTagsPicker} />
                </TagPicker>
            )
        }

        if (this.props.showCollectionsPicker) {
            return (
                <CollectionPicker
                    queryEntries={this.handleListQuery}
                    onUpdateEntrySelection={this.handleListUpdate}
                    initialSelectedEntries={this.fetchListsForPage}
                    actOnAllTabs={this.handleListAllTabs}
                    loadDefaultSuggestions={
                        collections.fetchInitialListSuggestions
                    }
                >
                    <BackContainer
                        onClick={this.props.toggleShowCollectionsPicker}
                    />
                </CollectionPicker>
            )
        }

        return (
            <React.Fragment>
                <SaveButtonBox>
                    <BookmarkButton closePopup={this.closePopup} />
                </SaveButtonBox>                
                <div className={styles.item}>
                    <TagsButton />
                </div>
                <div className={styles.item}>
                    <CollectionsButton />
                </div>
                <hr />
                <BottomBarBox>
                    <Search
                        searchValue={this.props.searchValue}
                        onSearchChange={this.props.handleSearchChange}
                        onSearchEnter={this.onSearchEnter}
                    />
                    <DashboardButtonBox>
                        <ButtonTooltip
                            tooltipText="Go to Dashboard"
                            position="left"
                        >
                                <LinkButtonBox
                                    src={icons.goTo}
                                    onClick={()=>{window.open(`${constants.OPTIONS_URL}#/overview`)}}
                                />
                        </ButtonTooltip> 
                    </DashboardButtonBox>
                </BottomBarBox>
                <hr />

                <div className={styles.item}>
                    <SidebarButton closePopup={this.closePopup} />
                </div>

                <div className={styles.item}>
                    <TooltipButton closePopup={this.closePopup} />
                </div>

                <hr />

                <div className={styles.buttonContainer}>
                    <a href="https://worldbrain.io/feedback" target="_blank" className={styles.feedbackButton}>
                        🐞 Feedback
                    </a>
                    <div className={styles.buttonBox}>
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
                </div>
            </React.Fragment>
        )
    }

    render() {
        return <div className={styles.popup}>{this.renderChildren()}</div>
    }
}

const LinkButtonBox = styled.img`
    height: 24px;
    width: 24px;
`

const SaveButtonBox =styled.div`
    height: 48px;
    background-color: #5cd9a6;
    margin: 2px;
    display: flex;
    align-items: center;
    cursor: default;
    font-weight: 600;
    margin-bottom: 5px;
    border-radius: 3px;

    & > button {
        display: flex;
        justify-content: center;
        padding: 0;
        font-weight: 600;
    }
`

const DashboardButtonBox = styled.div`
    height: 50px;
    width: 50px;
    margin: 0 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &: hover {
        background-color: #e0e0e0;
        border-radius: 3px;
    }
`


const BottomBarBox = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: 46px;
`



const mapState: MapStateToProps<StateProps, OwnProps, RootState> = (state) => ({
    tabId: selectors.tabId(state),
    url: selectors.url(state),
    searchValue: selectors.searchValue(state),
    blacklistConfirm: blacklist.showDeleteConfirm(state),
    showCollectionsPicker: collectionsSelectors.showCollectionsPicker(state),
    showTagsPicker: tagsSelectors.showTagsPicker(state),
})

const mapDispatch = (dispatch): DispatchProps => ({
    initState: () => dispatch(acts.initState()),
    handleSearchChange: (e) => {
        e.preventDefault()
        const input = e.target as HTMLInputElement
        dispatch(acts.setSearchVal(input.value))
    },
    toggleShowTagsPicker: () => dispatch(tagActs.toggleShowTagsPicker()),
    toggleShowCollectionsPicker: () =>
        dispatch(collectionActs.toggleShowTagsPicker()),
    onTagAdd: (tag: string) => dispatch(tagActs.addTagToPage(tag)),
    onTagDel: (tag: string) => dispatch(tagActs.deleteTag(tag)),
    onCollectionAdd: (collection: string) =>
        dispatch(collectionActs.addCollectionToPage(collection)),
    onCollectionDel: (collection: string) =>
        dispatch(collectionActs.deleteCollection(collection)),
})



export default connect<StateProps, DispatchProps, OwnProps>(
    mapState,
    mapDispatch,
)(PopupContainer)
