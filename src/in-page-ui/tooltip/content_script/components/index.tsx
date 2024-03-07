import React, { RefObject } from 'react'
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
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import * as cacheUtils from 'src/annotations/cache/utils'
import { UnifiedAnnotation, UnifiedList } from 'src/annotations/cache/types'
import { PageAnnotationsCache } from 'src/annotations/cache'
import { AnnotationInterface } from 'src/annotations/background/types'
import { ContentSharingInterface } from 'src/content-sharing/background/types'
import { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { RemotePageActivityIndicatorInterface } from 'src/page-activity-indicator/background/types'
import { RemoteBGScriptInterface } from 'src/background-script/types'
import { ImageSupportInterface } from 'src/image-support/background/types'
import { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import { Storage } from 'webextension-polyfill'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'

interface TooltipRootProps {
    mount: InPageUIRootMount
    params: Omit<Props, 'onTooltipInit'>
    onTooltipInit: (showTooltip: () => void) => void
    analyticsBG: AnalyticsCoreInterface
    annotationsBG: AnnotationInterface<'caller'>
    annotationsCache: PageAnnotationsCache
    contentSharingBG: ContentSharingInterface
    authBG: AuthRemoteFunctionsInterface
    spacesBG: RemoteCollectionsInterface
    bgScriptsBG: RemoteBGScriptInterface
    pageActivityIndicatorBG: RemotePageActivityIndicatorInterface
    localStorageAPI: Storage.LocalStorageArea
    getRootElement: () => HTMLElement
}

interface TooltipRootState {
    themeVariant?: MemexThemeVariant
    currentAnnotation?: UnifiedAnnotation
    currentAnnotationLists: UnifiedList[]
    showSpacePicker: boolean
}

class TooltipRoot extends React.Component<TooltipRootProps, TooltipRootState> {
    state: TooltipRootState = {
        currentAnnotation: null,
        currentAnnotationLists: [],
        showSpacePicker: false,
    }

    async componentDidMount() {
        this.setState({
            themeVariant: await loadThemeVariant(),
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
    }

    setCurrentAnnotation = (annotationId: string) => {
        const annotation = this.props.annotationsCache.annotations.byId[
            annotationId
        ]
        this.setState({ currentAnnotation: annotation })
    }

    selectSpaceForAnnotation = async (listId: number) => {
        const { currentAnnotation } = this.state
        if (!currentAnnotation) {
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
        ].unifiedListIds

        const unifiedListId = newList.unifiedId
        const updatedUnifiedListIdLists: UnifiedList['unifiedId'][] = [
            ...existing,
            unifiedListId,
        ]

        this.props.annotationsCache.updateAnnotation({
            ...currentAnnotation,
            unifiedListIds: updatedUnifiedListIdLists,
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
        const existingListsState = [...this.state.currentAnnotationLists]
        const index = existingListsState.findIndex(
            (list) => list.localId === listId,
        )
        if (index > -1) {
            existingListsState.splice(index, 1)
        }

        const UnifiedIdToRemove = this.props.annotationsCache.getListByLocalId(
            listId,
        )?.unifiedId

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

    saveAnnotation = async (commentState: string) => {
        const currentAnnotation = this.state.currentAnnotation
        const existingHighlight = this.props.annotationsCache.annotations.byId[
            currentAnnotation.unifiedId
        ]
        const comment = commentState

        this.props.annotationsCache.updateAnnotation({
            unifiedId: existingHighlight.unifiedId,
            remoteId: existingHighlight.remoteId,
            comment: comment,
            body: existingHighlight.body,
            privacyLevel: existingHighlight.privacyLevel,
            color: null,
            unifiedListIds: existingHighlight.unifiedListIds,
        })

        try {
            await this.props.annotationsBG.editAnnotation(
                existingHighlight.localId,
                comment,
                existingHighlight.color,
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
    }

    renderSpacePicker = (buttonRef?) => {
        console.log('this.props.mount.rootElement', buttonRef)
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
                    autoFocus={false}
                    onSpaceCreate={() => null}
                    initialSelectedListIds={() =>
                        cacheUtils.getLocalListIdsForCacheIds(
                            this.props.annotationsCache,
                            this.state.currentAnnotation.unifiedListIds,
                        )
                    }
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
                        placement="bottom-end"
                        getPortalRoot={this.props.getRootElement}
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
                        saveAnnotation={this.saveAnnotation}
                        getAnnotationData={this.getAnnotationData}
                        currentAnnotationLists={
                            this.state.currentAnnotationLists
                        }
                        currentAnnotation={this.state.currentAnnotation}
                        getAnnotationLists={this.getAnnotationLists}
                        toggleSpacePicker={this.toggleSpacePicker}
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
            />,
            mount.rootElement,
        )
    })
}

export function destroyUIContainer(target) {
    ReactDOM.unmountComponentAtNode(target)
}
