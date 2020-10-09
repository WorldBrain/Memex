import * as React from 'react'
import ReactDOM from 'react-dom'

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
import BetaFeatureNotifModal from 'src/overview/sharing/components/BetaFeatureNotifModal'

export interface Props extends ContainerProps {
    events: AnnotationsSidebarInPageEventEmitter
    inPageUI: SharedInPageUIInterface
    highlighter: HighlightInteractionsInterface
}

export class AnnotationsSidebarInPage extends AnnotationsSidebarContainer<
    Props
> {
    static defaultProps: Partial<Props> = {
        theme: {
            rightOffsetPx: 0,
            canClickAnnotations: true,
            paddingRight: 40,
        },
    }

    constructor(props: Props) {
        super({
            ...props,
            showBetaFeatureNotifModal: () =>
                this.processEvent('setBetaFeatureNotifModalShown', {
                    shown: true,
                }),
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

    componentDidUpdate(prevProps: Props) {
        const { pageUrl } = this.props

        if (pageUrl !== prevProps.pageUrl) {
            this.processEvent('setPageUrl', { pageUrl })
        }
    }

    private setupEventForwarding() {
        const { inPageUI, highlighter } = this.props

        inPageUI.events.on('stateChanged', this.handleInPageUIStateChange)
        inPageUI.events.on('sidebarAction', this.handleExternalAction)

        this.props.events.on('removeTemporaryHighlights', () =>
            highlighter.removeTempHighlights(),
        )
        this.props.events.on('highlightAndScroll', ({ url }) =>
            highlighter.highlightAndScroll({ url } as any),
        )
        this.props.events.on('removeAnnotationHighlights', ({ url }) =>
            highlighter.removeAnnotationHighlights(url),
        )
        this.props.events.on('renderHighlight', ({ highlight }) =>
            highlighter.renderHighlight(highlight, () => {
                inPageUI.showSidebar({
                    annotationUrl: highlight.url,
                    anchor: highlight.selector,
                    action: 'show_annotation',
                })
            }),
        )
    }

    cleanupEventForwarding = () => {
        this.props.inPageUI.events.removeAllListeners('stateChanged')
        this.props.inPageUI.events.removeAllListeners('sidebarAction')

        for (const event of this.props.events?.eventNames?.() ?? []) {
            this.props.events.removeAllListeners(event)
        }
    }

    private getDocument(): Document | undefined {
        // TODO: This doesn't work. fix it
        const containerNode = ReactDOM.findDOMNode(this)

        return containerNode?.getRootNode() as Document
    }

    private activateAnnotation(url: string) {
        this.processEvent('switchAnnotationMode', {
            annotationUrl: url,
            context: 'pageAnnotations',
            mode: 'default',
        })
        this.processEvent('setActiveAnnotationUrl', url)
        const annotationBoxNode = this.getDocument()?.getElementById(url)

        if (!annotationBoxNode) {
            return
        }

        annotationBoxNode.scrollIntoView({
            block: 'center',
            behavior: 'smooth',
        })
    }

    private handleExternalAction = (event: SidebarActionOptions) => {
        if (event.action === 'annotate') {
            this.processEvent('receiveNewAnnotation', {
                annotationData: event.annotationData,
                annotationUrl: event.annotationUrl,
                anchor: event.anchor,
            })
        } else if (event.action === 'comment') {
            this.processEvent('addNewPageComment', {
                comment: event.annotationData?.commentText,
                tags: event.annotationData?.tags,
            })
        } else if (event.action === 'show_annotation') {
            this.activateAnnotation(event.annotationUrl)
        } else if (event.action === 'edit_annotation') {
            this.processEvent('setAnnotationEditMode', {
                annotationUrl: event.annotationUrl,
                context: 'pageAnnotations',
            })
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

    protected bindAnnotationFooterEventProps(annotation: Annotation) {
        const boundProps = super.bindAnnotationFooterEventProps(annotation)

        return {
            ...boundProps,
            onDeleteConfirm: () => {
                boundProps.onDeleteConfirm()
                this.props.highlighter.removeAnnotationHighlights(
                    annotation.url,
                )
            },
        }
    }

    protected renderModals() {
        return (
            <>
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
                {this.state.showBetaFeatureNotifModal && (
                    <BetaFeatureNotifModal
                        ignoreReactPortal
                        betaRequestStrategy="go-to-options-page"
                        onClose={() =>
                            this.processEvent('setBetaFeatureNotifModalShown', {
                                shown: false,
                            })
                        }
                        showSubscriptionModal={() =>
                            console.log('UPGRADE BTN PRESSED')
                        }
                    />
                )}
            </>
        )
    }
}
