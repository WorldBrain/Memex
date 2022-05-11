import * as React from 'react'
import ReactDOM from 'react-dom'

import { theme } from 'src/common-ui/components/design-library/theme'
import { HighlightInteractionsInterface } from 'src/highlighting/types'
import {
    SharedInPageUIEvents,
    SidebarActionOptions,
    SharedInPageUIInterface,
} from 'src/in-page-ui/shared-state/types'
import {
    AnnotationsSidebarContainer,
    Props as ContainerProps,
} from './AnnotationsSidebarContainer'
import { AnnotationsSidebarInPageEventEmitter } from '../types'
import { Annotation } from 'src/annotations/types'
import ShareAnnotationOnboardingModal from 'src/overview/sharing/components/ShareAnnotationOnboardingModal'
import { UpdateNotifBanner } from 'src/common-ui/containers/UpdateNotifBanner'
import LoginModal from 'src/overview/sharing/components/LoginModal'
import DisplayNameModal from 'src/overview/sharing/components/DisplayNameModal'
import type { SidebarContainerLogic } from './logic'

export interface Props extends ContainerProps {
    events: AnnotationsSidebarInPageEventEmitter
    inPageUI: SharedInPageUIInterface
    highlighter: HighlightInteractionsInterface
}

export class AnnotationsSidebarInPage extends AnnotationsSidebarContainer<
    Props
> {
    static defaultProps: Pick<
        Props,
        'isLockable' | 'theme' | 'sidebarContext'
    > = {
        sidebarContext: 'in-page',
        isLockable: true,
        theme: {
            ...theme,
            rightOffsetPx: 0,
            canClickAnnotations: true,
            paddingRight: 40,
        },
    }

    constructor(props: Props) {
        super({
            ...props,
            showAnnotationShareModal: () =>
                this.processEvent('setAnnotationShareModalShown', {
                    shown: true,
                }),
        })
    }

    componentDidMount() {
        super.componentDidMount()
        this.setupEventForwarding()
    }

    componentWillUnmount() {
        super.componentWillUnmount()
        this.cleanupEventForwarding()
    }

    async componentDidUpdate(prevProps: Props) {
        const { pageUrl } = this.props

        if (pageUrl !== prevProps.pageUrl) {
            await this.processEvent('setPageUrl', {
                pageUrl,
                rerenderHighlights: true,
            })
        }
    }

    private setupEventForwarding() {
        const { inPageUI, highlighter, events: sidebarEvents } = this.props

        inPageUI.events.on('stateChanged', this.handleInPageUIStateChange)
        inPageUI.events.on('sidebarAction', this.handleExternalAction)

        sidebarEvents.on('removeTemporaryHighlights', () =>
            highlighter.removeTempHighlights(),
        )
        sidebarEvents.on('highlightAndScroll', ({ url }) =>
            highlighter.highlightAndScroll({ url } as any),
        )
        sidebarEvents.on('removeAnnotationHighlight', ({ url }) =>
            highlighter.removeAnnotationHighlight(url),
        )
        sidebarEvents.on('removeAnnotationHighlights', ({ urls }) =>
            highlighter.removeAnnotationHighlights(urls),
        )
        sidebarEvents.on('renderHighlight', ({ highlight }) =>
            highlighter.renderHighlight(highlight, () => {
                inPageUI.showSidebar({
                    annotationUrl: highlight.url,
                    anchor: highlight.selector,
                    action: 'show_annotation',
                })
            }),
        )
        sidebarEvents.on('renderHighlights', async ({ highlights }) => {
            await highlighter.renderHighlights(
                highlights,
                ({ annotationUrl }) => {
                    inPageUI.showSidebar({
                        annotationUrl,
                        action: 'show_annotation',
                    })
                },
            )
        })
    }

    cleanupEventForwarding = () => {
        this.props.inPageUI.events.removeAllListeners('stateChanged')
        this.props.inPageUI.events.removeAllListeners('sidebarAction')

        for (const event of this.props.events?.eventNames?.() ?? []) {
            this.props.events.removeAllListeners(event as any)
        }
    }

    private getDocument(): Document | undefined {
        // TODO: This doesn't work. fix it
        const containerNode = ReactDOM.findDOMNode(this)

        return containerNode?.getRootNode() as Document
    }

    private activateAnnotation(
        url: string,
        annotationMode: 'edit' | 'edit_spaces' | 'show',
    ) {
        if (annotationMode === 'show') {
            this.processEvent('switchAnnotationMode', {
                annotationUrl: url,
                context: 'pageAnnotations',
                mode: 'default',
            })
        } else {
            this.processEvent('setAnnotationEditMode', {
                annotationUrl: url,
                context: 'pageAnnotations',
            })

            if (annotationMode === 'edit_spaces') {
                this.processEvent('setListPickerAnnotationId', { id: url })
            }
        }

        this.processEvent('setActiveAnnotationUrl', { annotationUrl: url })
        const annotationBoxNode = this.getDocument()?.getElementById(url)

        if (!annotationBoxNode) {
            return
        }

        annotationBoxNode.scrollIntoView({
            block: 'center',
            behavior: 'smooth',
        })
    }

    private handleExternalAction = async (event: SidebarActionOptions) => {
        await (this.logic as SidebarContainerLogic).annotationsLoadComplete

        if (event.action === 'comment') {
            this.processEvent('addNewPageComment', {
                comment: event.annotationData?.commentText,
                tags: event.annotationData?.tags,
            })
        } else if (event.action === 'show_annotation') {
            this.activateAnnotation(event.annotationUrl, 'show')
        } else if (event.action === 'edit_annotation') {
            this.activateAnnotation(event.annotationUrl, 'edit')
        } else if (event.action === 'edit_annotation_spaces') {
            this.activateAnnotation(event.annotationUrl, 'edit_spaces')
        } else if (event.action === 'set_sharing_access') {
            this.processEvent('receiveSharingAccessChange', {
                sharingAccess: event.annotationSharingAccess,
            })
        }

        this.forceUpdate()
    }

    private handleInPageUIStateChange: SharedInPageUIEvents['stateChanged'] = ({
        changes,
    }) => {
        if ('sidebar' in changes) {
            if (changes.sidebar) {
                this.showSidebar()
            } else {
                this.hideSidebar()
            }
        }
    }

    hideSidebar() {
        super.hideSidebar()
        this.props.inPageUI.hideRibbon()
        this.props.inPageUI.hideSidebar()
    }

    protected getCreateProps() {
        const props = super.getCreateProps()

        return {
            ...props,
            onCancel: () => {
                props.onCancel()
                this.props.highlighter.removeTempHighlights()
            },
        }
    }

    protected bindAnnotationFooterEventProps(
        annotation: Annotation,
        followedListId?: string,
    ) {
        const boundProps = super.bindAnnotationFooterEventProps(
            annotation,
            followedListId,
        )

        return {
            ...boundProps,
            onDeleteConfirm: (e) => {
                boundProps.onDeleteConfirm(e)
                this.props.highlighter.removeAnnotationHighlight(annotation.url)
            },
        }
    }

    protected renderModals() {
        return (
            <>
                {super.renderModals()}
                {this.state.showLoginModal && (
                    <LoginModal
                        routeToLoginBtn
                        ignoreReactPortal
                        contentSharingBG={this.props.contentSharing}
                        contentScriptBG={this.props.contentScriptBackground}
                        onClose={() =>
                            this.processEvent('setLoginModalShown', {
                                shown: false,
                            })
                        }
                    />
                )}
                {this.state.showDisplayNameSetupModal && (
                    <DisplayNameModal
                        ignoreReactPortal
                        authBG={this.props.auth}
                        onClose={() =>
                            this.processEvent('setDisplayNameSetupModalShown', {
                                shown: false,
                            })
                        }
                    />
                )}
                {this.state.showAnnotationsShareModal && (
                    <ShareAnnotationOnboardingModal
                        ignoreReactPortal
                        onClose={() =>
                            this.processEvent('setAnnotationShareModalShown', {
                                shown: false,
                            })
                        }
                        onClickLetUsKnow={() => {
                            window.open(
                                'https://worldbrain.io/feedback/betafeatures',
                            )
                        }}
                        onClickViewRoadmap={() => {
                            window.open('https://worldbrain.io/roadmap')
                        }}
                        onClickSharingTutorial={() => {
                            window.open(
                                'https://worldbrain.io/tutorials/memex-social',
                            )
                        }}
                    />
                )}
            </>
        )
    }

    protected renderTopBanner() {
        return (
            <UpdateNotifBanner
                theme={{
                    ...theme,
                    position: 'fixed',
                    width: 'fill-available',
                    iconSize: '20px',
                }}
            />
        )
    }
}
