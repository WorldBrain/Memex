import React, { KeyboardEventHandler } from 'react'
import qs from 'query-string'
import { connect, MapStateToProps } from 'react-redux'
import browser from 'webextension-polyfill'
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
import { SidebarOpenButton } from './sidebar-open-button'
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
import CollectionPicker from 'src/custom-lists/ui/CollectionPicker'
import TagPicker from 'src/tags/ui/TagPicker'
import { tags, collections } from 'src/util/remote-functions-background'
import { BackContainer } from 'src/popup/components/BackContainer'
const styles = require('./components/Popup.css')
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'

import { createSyncSettingsStore } from 'src/sync-settings/util'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
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

    closePopup = () => window.close()

    onSearchEnter: KeyboardEventHandler<HTMLInputElement> = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault()
            analytics.trackEvent({
                category: 'Search',
                action: 'searchViaPopup',
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
        return this.props.url?.endsWith('.pdf')
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
                        size={'medium'}
                        type={'primary'}
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
                        size={'medium'}
                        type={'primary'}
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
                        header={'Add Page to Spaces'}
                        showAutoSaved={this.state.showAutoSaved}
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
                            return collections.createCustomList({
                                name: name,
                                id: Date.now(),
                            })
                        }}
                        initialSelectedListIds={() => this.state.pageListIds}
                        actOnAllTabs={this.handleListAllTabs}
                        shouldHydrateCacheOnInit
                        context={'popup'}
                    />
                </SpacePickerContainer>
            )
        }

        return (
            <PopupContainerContainer>
                {this.maybeRenderBlurredNotice()}
                <FeedActivitySection
                    onClick={() => window.open(this.whichFeed(), '_blank')}
                >
                    <FeedActivitySectionInnerContainer>
                        <Icon
                            icon={icons.feed}
                            heightAndWidth="22px"
                            hoverOff
                        />
                        Activity Feed
                    </FeedActivitySectionInnerContainer>
                    <FeedActivityDot
                        key="activity-feed-indicator"
                        activityIndicatorBG={this.activityIndicatorBG}
                        openFeedUrl={() =>
                            window.open(this.whichFeed(), '_blank')
                        }
                    />
                </FeedActivitySection>
                <BookmarkButton closePopup={this.closePopup} />
                <CollectionsButton pageListsIds={this.state.pageListIds} />
                <SpacerLine />
                {this.isCurrentPagePDF === true && (
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
                )}
                {this.getPDFMode() === 'reader' && (
                    <CopyPDFLinkButton
                        currentPageUrl={this.state.currentPageUrl}
                    />
                )}
                <LinkButton goToDashboard={this.onSearchClick} />
                <SidebarOpenButton closePopup={this.closePopup} />
                <QuickSettingsContainer>
                    Quick Settings <SpacerLine />
                </QuickSettingsContainer>

                <SidebarButton closePopup={this.closePopup} />
                <TooltipButton closePopup={this.closePopup} />
                <Footer>
                    <MemexLogo />
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
                </Footer>
            </PopupContainerContainer>
        )
    }

    render() {
        return <div className={styles.popup}>{this.renderChildren()}</div>
    }
}

const MemexLogo = styled.div`
    background-image: url('/img/memexLogoGrey.svg');
    background-position: left center;
    height: 24px;
    width: 110px;
    display: flex;
    justify-content: flex-start;
    outline: none;
    border: none;
    background-repeat: no-repeat;
`

const QuickSettingsContainer = styled.div`
    display: flex;
    grid-gap: 10px;
    color: ${(props) => props.theme.colors.greyScale4};
    white-space: nowrap;
    align-items: center;
    padding-left: 20px;
`

const SpacerLine = styled.div`
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale3};
    width: 100%;
`

const Footer = styled.div`
    height: 40px;
    display: flex;
    padding: 0 15px 0 20px;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid ${(props) => props.theme.colors.greyScale3};
`

const PopupContainerContainer = styled.div`
    background: ${(props) => props.theme.colors.greyScale1};
    border: 1px solid ${(props) => props.theme.colors.greyScale3};
`

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
    color: ${(props) => props.theme.colors.white};
    font-weight: 500;
    flex: 1;
    width: fill-available;
`

const NoticeTitle = styled.div`
    font-size: 16px;
    color: ${(props) => props.theme.colors.white};
    font-weight: bold;
    text-align: center;
    margin-bottom: 20px;
`

const LoadingBox = styled.div`
    display: flex;
    height: 200px;
    justify-content: center;
    align-items: center;
    background-color: ${(props) => props.theme.colors.greyScale1};
`

const NoticeSubTitle = styled.div`
    font-size: 14px;
    color: ${(props) => props.theme.colors.greyScale5};
    font-weight: 300;
    padding-bottom: 15px;
    text-align: center;
    padding: 0 10px;
    margin-bottom: 20px;
`

const BlurredNotice = styled.div<{
    browser: string
    location: string
}>`
    position: absolute;
    height: 100%;
    width: 100%;
    z-index: 30;
    overflow-y: ${(props) =>
        props.browser === 'firefox' && props.location === 'local'
            ? 'hidden'
            : 'scroll'};
    background: ${(props) => (props.browser === 'firefox' ? 'white' : 'none')};
    backdrop-filter: blur(10px);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }
`

const FeedActivitySection = styled.div`
    width: fill-available;
    display: flex;
    justify-content: space-between;
    height: 50px;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale3};
    align-items: center;
    padding: 0px 20px 0px 20px;
    grid-auto-flow: column;
    width: fill-available;

    & * {
        cursor: pointer;
    }

    // &:hover {
    //     background-color: ${(props) => props.theme.colors.black};
    // }
`

const SpacePickerContainer = styled.div`
    display: flex;
    flex-direction: column;
    background-color: ${(props) => props.theme.colors.greyScale1};
    min-height: 500px;
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
