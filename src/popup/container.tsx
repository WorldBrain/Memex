import React, { KeyboardEventHandler } from 'react'
import qs from 'query-string'
import { connect, MapStateToProps } from 'react-redux'
import { browser } from 'webextension-polyfill-ts'
import styled from 'styled-components'

import { StatefulUIElement } from 'src/util/ui-logic'
import * as constants from '../constants'
import Logic, { State, Event } from './logic'
import analytics from '../analytics'
import extractQueryFilters from '../util/nlp-time-filter'
import { remoteFunction, runInBackground } from '../util/webextensionRPC'
import LinkButton from './components/LinkButton'
import CopyPDFLinkButton from './components/CopyPDFLinkButton'
import { TooltipButton } from './tooltip-button'
import { SidebarButton } from './sidebar-button'
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
import { PDFReaderButton } from './pdf-reader-button'
import { BookmarkButton } from './bookmark-button'
import * as selectors from './selectors'
import * as acts from './actions'
import { ClickHandler, RootState } from './types'
import { EVENT_NAMES } from '../analytics/internal/constants'
import CollectionPicker from 'src/custom-lists/ui/CollectionPicker'
import TagPicker from 'src/tags/ui/TagPicker'
import { tags, collections } from 'src/util/remote-functions-background'
import { BackContainer } from 'src/popup/components/BackContainer'
const styles = require('./components/Popup.css')
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'

import { createSyncSettingsStore } from 'src/sync-settings/util'
import { isFullUrlPDF } from 'src/util/uri-utils'
import { ToggleSwitchButton } from './components/ToggleSwitchButton'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import checkBrowser from 'src/util/check-browser'
import { FeedActivityDot } from 'src/activity-indicator/ui'
import type { ActivityIndicatorInterface } from 'src/activity-indicator/background'
import { isUrlPDFViewerUrl } from 'src/pdf/util'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

export interface OwnProps {}

interface StateProps {
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

class PopupContainer extends StatefulUIElement<Props, State, Event> {
    private browserName = checkBrowser()
    private activityIndicatorBG: ActivityIndicatorInterface = runInBackground()
    constructor(props: Props) {
        super(
            props,
            new Logic({
                tabsAPI: browser.tabs,
                runtimeAPI: browser.runtime,
                extensionAPI: browser.extension,
                customListsBG: collections,
                pdfIntegrationBG: runInBackground(),
                syncSettings: createSyncSettingsStore({
                    syncSettingsBG: runInBackground(),
                }),
            }),
        )
    }

    async componentDidMount() {
        await super.componentDidMount()
        analytics.trackEvent({
            category: 'Global',
            action: 'openPopup',
        })

        await this.props.initState()
    }

    processAnalyticsEvent = remoteFunction('processEvent')

    closePopup = () => window.close()

    onSearchEnter: KeyboardEventHandler<HTMLInputElement> = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault()
            analytics.trackEvent({
                category: 'Search',
                action: 'searchViaPopup',
            })

            this.processAnalyticsEvent({
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

    onSearchClick = () => {
        const queryFilters = extractQueryFilters(this.props.searchValue)
        const queryParams = qs.stringify(queryFilters)

        browser.tabs.create({
            url: `${constants.OVERVIEW_URL}?${queryParams}`,
        }) // New tab with query

        this.closePopup()
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
    fetchTagsForPage = async () => tags.fetchPageTags({ url: this.props.url })

    handleListUpdate = async ({ added, deleted }) => {
        const backendResult = collections.updateListForPage({
            added,
            deleted,
            url: this.props.url,
        })
        // Redux actions
        if (added) {
            await this.processEvent('addPageList', { listId: added })
            this.props.onCollectionAdd(added)
        }
        if (deleted) {
            await this.processEvent('delPageList', { listId: deleted })
            this.props.onCollectionDel(deleted)
        }
        return backendResult
    }

    handleListAllTabs = (listId: number) =>
        collections.addOpenTabsToList({ listId })

    getPDFLocation = () => {
        if (this.state.currentPageUrl.startsWith('file://')) {
            return 'local'
        } else {
            return 'remote'
        }
    }

    private get isCurrentPagePDF(): boolean {
        return isFullUrlPDF(this.props.url)
    }

    getPDFMode = () => {
        if (
            isUrlPDFViewerUrl(this.state.currentPageUrl, {
                runtimeAPI: browser.runtime,
            })
        ) {
            return 'reader'
        } else {
            return 'original'
        }
    }

    private whichFeed = () => {
        if (process.env.NODE_ENV === 'production') {
            return 'https://memex.social/feed'
        } else {
            return 'https://staging.memex.social/feed'
        }
    }

    private maybeRenderBlurredNotice() {
        if (!this.isCurrentPagePDF) {
            return null
        }

        const mode = this.getPDFMode()
        const location = this.getPDFLocation()

        if (this.browserName === 'firefox' && location === 'local') {
            return (
                <BlurredNotice browser={this.browserName}>
                    <NoticeTitle>
                        Annotating local PDFs is not possible on Firefox
                    </NoticeTitle>
                    <NoticeSubTitle>
                        Use Chromium-based browsers to use this feature
                    </NoticeSubTitle>
                </BlurredNotice>
            )
        }

        if (
            this.browserName !== 'firefox' &&
            location === 'local' &&
            !this.state.isFileAccessAllowed
        ) {
            return (
                <BlurredNotice browser={this.browserName}>
                    <NoticeTitle>
                        To annotate file based PDFs enable the setting
                    </NoticeTitle>
                    <NoticeSubTitle>"Allow access to file URLs"</NoticeSubTitle>
                    <PrimaryAction
                        label="Go to Settings"
                        onClick={() =>
                            browser.tabs.create({
                                url: `chrome://extensions/?id=${browser.runtime.id}`,
                            })
                        }
                    />
                </BlurredNotice>
            )
        }

        if (mode === 'original') {
            return (
                <BlurredNotice browser={this.browserName}>
                    <NoticeTitle>Save & annotate this PDF</NoticeTitle>
                    <PrimaryAction
                        label="Open Memex PDF Reader"
                        onClick={() =>
                            this.processEvent('togglePDFReader', null)
                        }
                    />
                </BlurredNotice>
            )
        }

        return null
    }

    renderChildren() {
        if (this.state.loadState === 'running') {
            return (
                <LoadingBox>
                    <LoadingIndicator />
                </LoadingBox>
            )
        }

        if (this.props.showTagsPicker) {
            return (
                <SpacePickerContainer>
                    <BackContainer
                        onClick={this.props.toggleShowTagsPicker}
                        header="Add Tags"
                    />
                    <TagPicker
                        onUpdateEntrySelection={this.handleTagUpdate}
                        initialSelectedEntries={this.fetchTagsForPage}
                        actOnAllTabs={this.handleTagAllTabs}
                    ></TagPicker>
                </SpacePickerContainer>
            )
        }

        if (this.props.showCollectionsPicker) {
            return (
                <SpacePickerContainer>
                    <BackContainer
                        onClick={this.props.toggleShowCollectionsPicker}
                        header={'Add to Spaces'}
                    />
                    <CollectionPicker
                        selectEntry={(listId) =>
                            this.handleListUpdate({
                                added: listId,
                                deleted: null,
                            })
                        }
                        unselectEntry={(listId) =>
                            this.handleListUpdate({
                                added: null,
                                deleted: listId,
                            })
                        }
                        createNewEntry={async (name) => {
                            this.props.onCollectionAdd(name)
                            return collections.createCustomList({ name })
                        }}
                        initialSelectedEntries={() => this.state.pageListIds}
                        actOnAllTabs={this.handleListAllTabs}
                    />
                </SpacePickerContainer>
            )
        }

        return (
            <PopupContainerContainer>
                <FeedActivitySection>
                    <FeedActivitySectionInnerContainer
                        onClick={() => window.open(this.whichFeed(), '_blank')}
                    >
                        <FeedActivityDot
                            key="activity-feed-indicator"
                            activityIndicatorBG={this.activityIndicatorBG}
                            openFeedUrl={() =>
                                window.open(this.whichFeed(), '_blank')
                            }
                        />
                        Activity Feed
                    </FeedActivitySectionInnerContainer>
                    <ButtonContainer>
                        <Icon
                            onClick={() =>
                                window.open('https://worldbrain.io/tutorials')
                            }
                            filePath={icons.helpIcon}
                            heightAndWidth={'20px'}
                        />
                        <Icon
                            onClick={() =>
                                window.open(
                                    `${constants.OPTIONS_URL}#/settings`,
                                )
                            }
                            filePath={icons.settings}
                            heightAndWidth={'20px'}
                        />
                        {/*<NotifButton />*/}
                    </ButtonContainer>
                </FeedActivitySection>
                {this.maybeRenderBlurredNotice()}
                <BookmarkButton closePopup={this.closePopup} />
                <CollectionsButton pageListsIds={this.state.pageListIds} />
                {this.state.shouldShowTagsUIs && <TagsButton />}
                <hr />
                <LinkButton goToDashboard={this.onSearchClick} />

                <hr />

                <SidebarButton closePopup={this.closePopup} />
                <TooltipButton closePopup={this.closePopup} />
                <PDFReaderButton
                    pdfMode={this.getPDFMode()}
                    //closePopup={this.closePopup}
                    onBtnClick={() =>
                        this.processEvent('togglePDFReader', null)
                    }
                    onToggleClick={() => {
                        this.processEvent('togglePDFReaderEnabled', null)
                    }}
                    isEnabled={this.state.isPDFReaderEnabled}
                />
                {this.getPDFMode() === 'reader' && (
                    <CopyPDFLinkButton
                        currentPageUrl={this.state.currentPageUrl}
                    />
                )}
            </PopupContainerContainer>
        )
    }

    render() {
        return <div className={styles.popup}>{this.renderChildren()}</div>
    }
}

const PopupContainerContainer = styled.div``

const ButtonContainer = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 5px;
`

const FeedActivitySectionInnerContainer = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 16px;
    font-size: 14px;
    justify-content: flex-start;
    cursor: pointer;
    color: ${(props) => props.theme.colors.darkerText};
    font-weight: 700;
    flex: 1;
    max-width: 50%;
`

const NoticeTitle = styled.div`
    font-size: 16px;
    color: ${(props) => props.theme.colors.primary};
    font-weight: bold;
    padding-bottom: 10px;
    text-align: center;
    padding: 0 10px;
    margin-bottom: 20px;
`

const LoadingBox = styled.div`
    display: flex;
    height: 200px;
    justify-content: center;
    align-items: center;
`

const NoticeSubTitle = styled.div`
    font-size: 14px;
    color: ${(props) => props.theme.colors.darkgrey};
    font-weight: normal;
    padding-bottom: 15px;
    text-align: center;
    padding: 0 10px;
    margin-bottom: 20px;
`

const BlurredNotice = styled.div<{
    browser: string
    location: string
}>`
    position absolute;
    height: ${(props) =>
        props.browser === 'firefox' && props.location === 'local'
            ? '90%'
            : ' 66%'};
    border-bottom: 1px solid #e0e0e0;
    width: 100%;
    z-index: 20;
    overflow-y: ${(props) =>
        props.browser === 'firefox' && props.location === 'local'
            ? 'hidden'
            : 'scroll'};
    background: ${(props) => (props.browser === 'firefox' ? 'white' : 'none')};
    backdrop-filter: blur(10px);
    display: flex;
    justify-content: flex-start;
    padding-top: 50px;
    align-items: center;
    flex-direction: column;
`

const DashboardButtonBox = styled.div`
    height: 45px;
    width: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &: hover {
        background-color: #e0e0e0;
        border-radius: 3px;
    }
`

const FeedActivitySection = styled.div`
    width: fill-available;
    display: flex;
    justify-content: space-between;
    height: 50px;
    border-bottom: 1px solid ${(props) => props.theme.colors.lineGrey};
    align-items: center;
    padding: 0px 10px 0px 24px;
    grid-auto-flow: column;

    // &:hover {
    //     background-color: ${(props) => props.theme.colors.backgroundColor};
    // }
`

const BottomBarBox = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: 45px;

    & > div {
        width: 45px;
    }
`

const LinkButtonBox = styled.img`
    height: 24px;
    width: 24px;
`

const SpacePickerContainer = styled.div`
    display: flex;
    flex-direction: column;
`

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = (state) => ({
    tabId: selectors.tabId(state),
    url: selectors.url(state),
    searchValue: selectors.searchValue(state),
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
