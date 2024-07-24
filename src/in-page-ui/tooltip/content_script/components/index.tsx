import React from 'react'
import ReactDOM from 'react-dom'
import { StyleSheetManager, ThemeProvider } from 'styled-components'

import TooltipContainer, {
    Props,
} from '@worldbrain/memex-common/lib/in-page-ui/tooltip/container'
import {
    loadThemeVariant,
    theme,
} from 'src/common-ui/components/design-library/theme'
import type { InPageUIRootMount } from 'src/in-page-ui/types'
import { MemexThemeVariant } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import CollectionPicker from 'src/custom-lists/ui/CollectionPicker'
import * as cacheUtils from 'src/annotations/cache/utils'
import { UnifiedAnnotation, UnifiedList } from 'src/annotations/cache/types'
import { PageAnnotationsCache } from 'src/annotations/cache'
import { AnnotationInterface } from 'src/annotations/background/types'
import { ContentSharingInterface } from 'src/content-sharing/background/types'
import { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { RemotePageActivityIndicatorInterface } from 'src/page-activity-indicator/background/types'
import { RemoteBGScriptInterface } from 'src/background-script/types'
import { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import { Storage } from 'webextension-polyfill'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import { SharedInPageUIInterface } from 'src/in-page-ui/shared-state/types'
import {
    TypedRemoteEventEmitter,
    getRemoteEventEmitter,
} from 'src/util/webextensionRPC'
import {
    AnnotationPrivacyLevels,
    RGBAColor,
} from '@worldbrain/memex-common/lib/annotations/types'
import PromptTemplatesComponent from 'src/common-ui/components/prompt-templates'
import { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import {
    SyncSettingsStore,
    createSyncSettingsStore,
} from 'src/sync-settings/util'
import HighlightColorPicker from 'src/annotations/components/highlightColorPicker'
import { HighlightColor } from '@worldbrain/memex-common/lib/common-ui/components/highlightColorPicker/types'
import { HIGHLIGHT_COLORS_DEFAULT } from '@worldbrain/memex-common/lib/common-ui/components/highlightColorPicker/constants'
import { PseudoSelection } from '@worldbrain/memex-common/lib/in-page-ui/types'
import { cloneSelectionAsPseudoObject } from '@worldbrain/memex-common/lib/annotations/utils'

interface TooltipRootProps {
    mount: InPageUIRootMount
    params: Omit<Props, 'onTooltipInit'>
    onTooltipInit: (showTooltip: () => void) => void
    toggleTooltipState: (state: boolean) => Promise<void>
    analyticsBG: AnalyticsCoreInterface
    annotationsBG: AnnotationInterface<'caller'>
    annotationsCache: PageAnnotationsCache
    contentSharingBG: ContentSharingInterface
    authBG: AuthRemoteFunctionsInterface
    spacesBG: RemoteCollectionsInterface
    syncSettingsBG: RemoteSyncSettingsInterface
    bgScriptsBG: RemoteBGScriptInterface<'caller'>
    pageActivityIndicatorBG: RemotePageActivityIndicatorInterface
    localStorageAPI: Storage.LocalStorageArea
    getRootElement: () => HTMLElement
    inPageUI: SharedInPageUIInterface
    createHighlight(
        selection?: PseudoSelection,
        shouldShare?: boolean | null,
        shouldCopyShareLink?: boolean | null,
        drawRectangle?: boolean | null,
        highlightColor?: HighlightColor['id'],
        preventHideTooltip?: boolean,
    ): Promise<any | null>
    getWindow: () => Window
}

interface TooltipRootState {
    themeVariant?: MemexThemeVariant
    currentAnnotation?: UnifiedAnnotation
    currentAnnotationLists: UnifiedList[]
    showSpacePicker: boolean
    spaceSearchResults: any[]
    askAITabActive?: boolean
    aiPrompt?: string
    currentSelection: PseudoSelection
    showColorPicker: boolean
}

class TooltipRoot extends React.Component<TooltipRootProps, TooltipRootState> {
    syncSettings: SyncSettingsStore<'highlightColors'>

    state: TooltipRootState = {
        currentAnnotation: null,
        currentAnnotationLists: [],
        showSpacePicker: false,
        spaceSearchResults: [],
        askAITabActive: false,
        aiPrompt: null,
        currentSelection: null,
        showColorPicker: null,
    }
    private summarisePageEvents: TypedRemoteEventEmitter<'pageSummary'>

    constructor(props: TooltipRootProps) {
        super(props)
        this.syncSettings = createSyncSettingsStore({
            syncSettingsBG: this.props.syncSettingsBG,
        })
    }

    async componentDidMount() {
        this.setState({
            themeVariant: await loadThemeVariant(),
        })

        this.summarisePageEvents = getRemoteEventEmitter('pageSummary')

        this.summarisePageEvents.on('setActiveSidebarTab', ({ activeTab }) => {
            this.setState({
                askAITabActive: true,
            })
        })

        document.addEventListener('selectionchange', () => {
            const selection = cloneSelectionAsPseudoObject(
                this.props.getWindow()?.getSelection(),
            )
            if (selection) {
                this.setState({
                    currentSelection: selection,
                })
            }
        })
    }

    getAnnotationData = (annotationId: string) => {
        const annotation = this.props.annotationsCache.annotations.byId[
            annotationId
        ]
        return annotation.comment
    }

    toggleSpacePicker = (stateToSet?) => {
        if (stateToSet === undefined) {
            this.setState((state) => ({
                showSpacePicker: !state.showSpacePicker,
            }))
        } else {
            this.setState({
                showSpacePicker: stateToSet,
            })
        }
    }

    updateSpacesSearchSuggestions = async (query: string) => {
        const lists = this.props.annotationsCache.lists.allIds
            .filter(
                (listId) =>
                    this.props.annotationsCache.lists.byId[listId].name
                        .toLowerCase()
                        .includes(query.toLowerCase()) &&
                    this.props.annotationsCache.lists.byId[listId].type !==
                        'page-link',
            )
            .map((listId) => ({
                id: this.props.annotationsCache.lists.byId[listId].localId,
                name: this.props.annotationsCache.lists.byId[listId].name,
            }))
        this.setState({
            spaceSearchResults: lists,
        })
    }

    getAnnotationLists = async (annotationId: string) => {
        const annotation = this.props.annotationsCache.annotations.byId[
            annotationId
        ]
        const lists = annotation.unifiedListIds
        const annotationLists = []
        for (const list of lists) {
            const listToAdd = this.props.annotationsCache.lists.byId[list]
            annotationLists.push(listToAdd)
        }
        this.setState({
            currentAnnotationLists: annotationLists,
        })

        return annotationLists
    }

    setCurrentAnnotation = (annotationId: string) => {
        if (!annotationId) {
            this.setState({
                currentAnnotation: null,
                currentAnnotationLists: [],
            })
            return
        }
        const annotation = this.props.annotationsCache.annotations.byId[
            annotationId
        ]
        this.setState({
            currentAnnotation: annotation,
            currentAnnotationLists: [],
        })
    }

    selectSpaceForAnnotation = async (listId: number) => {
        const { currentAnnotation } = this.state

        if (!currentAnnotation) {
            return
        }

        const isListAlreadySelected = this.state.currentAnnotationLists.some(
            (currentList) => currentList.localId === listId,
        )

        if (isListAlreadySelected) {
            return
        }

        const newList = this.props.annotationsCache.getListByLocalId(listId)
        const listsForState = [...this.state.currentAnnotationLists]
        listsForState.push(newList)

        this.setState({
            currentAnnotationLists: listsForState,
        })

        const existing = this.props.annotationsCache.annotations.byId[
            currentAnnotation.unifiedId
        ]?.unifiedListIds

        const unifiedListId = newList.unifiedId
        const updatedUnifiedListIdLists: UnifiedList['unifiedId'][] = [
            ...existing,
            unifiedListId,
        ]

        this.props.annotationsCache.updateAnnotation({
            ...currentAnnotation,
            unifiedListIds: updatedUnifiedListIdLists,
            privacyLevel: AnnotationPrivacyLevels.PROTECTED,
        })

        this.props.contentSharingBG.shareAnnotationToSomeLists({
            annotationUrl: currentAnnotation.localId,
            localListIds: [listId],
            protectAnnotation: true,
        })
    }
    removeSpaceForAnnotation = async (listId: number) => {
        const { currentAnnotation } = this.state
        if (!currentAnnotation) {
            return
        }

        const listToRemove = this.props.annotationsCache.getListByLocalId(
            listId,
        )

        let existingListsState = [...this.state.currentAnnotationLists]

        const index = existingListsState.findIndex(
            (list) => list.localId === listId,
        )

        if (index > -1) {
            existingListsState.splice(index, 1) // This modifies existingListsState in place
        }

        this.setState({
            currentAnnotationLists: existingListsState,
        })

        const UnifiedIdToRemove = listToRemove?.unifiedId

        const existing = this.props.annotationsCache.annotations.byId[
            currentAnnotation.unifiedId
        ].unifiedListIds
        const unifiedListIds = [...existing]

        const unifiedIdIndex = unifiedListIds.indexOf(UnifiedIdToRemove)
        if (unifiedIdIndex > -1) {
            unifiedListIds.splice(unifiedIdIndex, 1)
        }

        this.props.annotationsCache.updateAnnotation({
            ...currentAnnotation,
            unifiedListIds: [...unifiedListIds],
        })

        this.props.contentSharingBG.unshareAnnotationFromList({
            annotationUrl: currentAnnotation.localId,
            localListId: listId,
        })
    }

    addNewSpaceViaWikiLinks = async (spaceName: string) => {
        const {
            localListId,
            remoteListId,
            collabKey,
        } = await this.props.spacesBG.createCustomList({
            name: spaceName,
        })

        const creatorId = (await this.props.authBG.getCurrentUser()).id
        const userReference: UserReference = {
            type: 'user-reference',
            id: creatorId,
        }

        this.props.annotationsCache.addList({
            name: spaceName,
            collabKey,
            localId: localListId,
            remoteId: remoteListId,
            hasRemoteAnnotationsToLoad: false,
            type: 'user-list',
            unifiedAnnotationIds: [],
            creator: userReference ?? undefined,
            parentLocalId: null,
            isPrivate: true,
        })

        await this.selectSpaceForAnnotation(localListId)
    }

    renderHighlightColorPicker = () => {
        return (
            <HighlightColorPicker
                syncSettingsBG={this.props.syncSettingsBG}
                annotationId={this.state.currentAnnotation?.unifiedId ?? null}
                updateAnnotationColor={async (color: HighlightColor['id']) => {
                    this.setState({
                        showColorPicker: true,
                    })
                    if (!this.state.currentAnnotation) {
                        await this.props.createHighlight(
                            this.state.currentSelection,
                            false,
                            false,
                            false,
                            color,
                            false,
                        )
                        this.setState({
                            currentSelection: null,
                            showColorPicker: false,
                        })
                    } else {
                        await this.saveAnnotation(null, color)
                    }
                }}
                selectedColor={
                    this.state.currentAnnotation?.color ??
                    HIGHLIGHT_COLORS_DEFAULT[0].id
                }
            />
        )
    }

    getHighlightColorsSettings = async () => {
        return await this.syncSettings.highlightColors.get('highlightColors')
    }

    saveAnnotation = async (
        commentState: string,
        color?: HighlightColor['id'],
    ) => {
        const currentAnnotation = this.state.currentAnnotation
        const existingHighlight = this.props.annotationsCache.annotations.byId[
            currentAnnotation.unifiedId
        ]
        const comment = commentState

        this.props.annotationsCache.updateAnnotation(
            {
                unifiedId: existingHighlight.unifiedId,
                remoteId: existingHighlight.remoteId,
                comment: comment ?? existingHighlight.comment,
                body: existingHighlight.body,
                privacyLevel: existingHighlight.privacyLevel,
                color: color ?? existingHighlight.color,
                unifiedListIds: existingHighlight.unifiedListIds,
            },
            {
                updateLastEditedTimestamp: true,
            },
        )

        try {
            await this.props.annotationsBG.editAnnotation(
                existingHighlight.localId,
                comment,
                color ?? existingHighlight.color,
                existingHighlight.body,
            )
            // shareOpts: {
            //     shouldShare: event.shouldShare,
            //     shouldCopyShareLink: event.shouldShare,
            //     isBulkShareProtected:
            //         event.isProtected || !!event.keepListsIfUnsharing,
            //     skipPrivacyLevelUpdate: event.mainBtnPressed,
            // },
        } catch (err) {
            console.log(err)
        }
        this.setState({
            currentAnnotation: {
                ...currentAnnotation,
                comment,
                color: color ?? existingHighlight.color,
            },
        })
    }

    renderPromptTemplates = () => {
        return (
            <PromptTemplatesComponent
                syncSettingsBG={this.props.syncSettingsBG}
                getRootElement={this.props.getRootElement}
                onTemplateSelect={(text: string) =>
                    this.setState({
                        aiPrompt: text,
                    })
                }
            />
        )
    }

    renderSpacePicker = (buttonRef?) => {
        if (this.state.showSpacePicker) {
            const CollectionsPickerElement = (
                <CollectionPicker
                    authBG={this.props.authBG}
                    spacesBG={this.props.spacesBG}
                    annotationsCache={this.props.annotationsCache}
                    contentSharingBG={this.props.contentSharingBG}
                    bgScriptBG={this.props.bgScriptsBG}
                    analyticsBG={this.props.analyticsBG}
                    pageActivityIndicatorBG={this.props.pageActivityIndicatorBG}
                    getRootElement={() => this.props.mount.rootElement}
                    localStorageAPI={this.props.localStorageAPI}
                    selectEntry={(listId: number) =>
                        this.selectSpaceForAnnotation(listId)
                    }
                    unselectEntry={(listId: number) =>
                        this.removeSpaceForAnnotation(listId)
                    }
                    onSpaceCreate={() => null}
                    initialSelectedListIds={() =>
                        cacheUtils.getLocalListIdsForCacheIds(
                            this.props.annotationsCache,
                            this.state.currentAnnotation?.unifiedListIds ?? [],
                        )
                    }
                    closePicker={() => this.toggleSpacePicker(false)}
                    // normalizedPageUrlToFilterPageLinksBy={normalizeUrl(
                    //     'this.state.fullPageUrl',
                    // )}
                />
            )

            if (!buttonRef) {
                return CollectionsPickerElement
            } else {
                return (
                    <PopoutBox
                        targetElementRef={buttonRef.current}
                        placement="bottom-start"
                        getPortalRoot={this.props.getRootElement}
                        offsetX={12}
                        offsetY={-10}
                        closeComponent={() => this.toggleSpacePicker(false)}
                        blockedBackground
                        blockedBackgroundTransparent
                        instaClose
                    >
                        {CollectionsPickerElement}
                    </PopoutBox>
                )
            }
        }
    }

    render() {
        const { themeVariant } = this.state
        if (!themeVariant) {
            return null
        }
        const { props } = this

        return (
            <StyleSheetManager target={props.mount.shadowRoot as any}>
                <ThemeProvider theme={theme({ variant: themeVariant })}>
                    <TooltipContainer
                        onTooltipInit={props.onTooltipInit}
                        {...props.params}
                        context="extension"
                        getRootElement={() => props.mount.rootElement}
                        setCurrentAnnotation={this.setCurrentAnnotation}
                        renderSpacePicker={(buttonRef) =>
                            this.renderSpacePicker(buttonRef)
                        }
                        promptTemplates={this.renderPromptTemplates}
                        saveAnnotation={this.saveAnnotation}
                        getAnnotationData={this.getAnnotationData}
                        currentAnnotationLists={
                            this.state.currentAnnotationLists
                        }
                        getHighlightColorsSettings={
                            this.getHighlightColorsSettings
                        }
                        currentAnnotation={this.state.currentAnnotation}
                        getAnnotationLists={this.getAnnotationLists}
                        toggleSpacePicker={this.toggleSpacePicker}
                        removeSpaceForAnnotation={this.removeSpaceForAnnotation}
                        selectSpaceForAnnotation={this.selectSpaceForAnnotation}
                        updateSpacesSearchSuggestions={
                            this.updateSpacesSearchSuggestions
                        }
                        spaceSearchResults={this.state.spaceSearchResults}
                        addNewSpaceViaWikiLinks={this.addNewSpaceViaWikiLinks}
                        isAskAIOpen={this.state.askAITabActive}
                        showSpacePicker={this.state.showSpacePicker}
                        aiPrompt={this.state.aiPrompt}
                        themeVariant={themeVariant}
                        renderHighlightColorPicker={
                            this.renderHighlightColorPicker
                        }
                        showColorPicker={this.state.showColorPicker}
                        toggleTooltipState={props.toggleTooltipState}
                    />
                </ThemeProvider>
            </StyleSheetManager>
        )
    }
}

export function setupUIContainer(
    mount: InPageUIRootMount,
    params: Omit<Props, 'onTooltipInit'>,
    props: Omit<TooltipRootProps, 'mount' | 'params' | 'onTooltipInit'>,
): Promise<() => void> {
    return new Promise(async (resolve) => {
        ReactDOM.render(
            <TooltipRoot
                mount={mount}
                params={params}
                onTooltipInit={resolve}
                annotationsBG={props.annotationsBG}
                annotationsCache={props.annotationsCache}
                contentSharingBG={props.contentSharingBG}
                authBG={props.authBG}
                spacesBG={props.spacesBG}
                bgScriptsBG={props.bgScriptsBG}
                analyticsBG={props.analyticsBG}
                pageActivityIndicatorBG={props.pageActivityIndicatorBG}
                localStorageAPI={props.localStorageAPI}
                getRootElement={props.getRootElement}
                inPageUI={props.inPageUI}
                syncSettingsBG={props.syncSettingsBG}
                createHighlight={params.createHighlight}
                getWindow={params.getWindow}
                toggleTooltipState={props.toggleTooltipState}
            />,
            mount.rootElement,
        )
    })
}

export function destroyUIContainer(target) {
    ReactDOM.unmountComponentAtNode(target)
}
