import * as React from 'react'
import {
    connect,
    MapStateToProps,
    MapDispatchToPropsFunction,
} from 'react-redux'
// import onClickOutside from 'react-onclickoutside'

// import {
//     remoteFunction,
//     makeRemotelyCallable,
// } from '../../../util/webextensionRPC'
import RootState, { ClickHandler } from '../../types'
import Ribbon from './ribbon'
import * as selectors from '../selectors'
// import { Anchor } from '../../../direct-linking/content_script/interactions'

// interface Props {
//     onInit: ({ toggleSidebar }: { toggleSidebar: () => void }) => any
//     destroy: () => any
//     getInitialState: () => {
//         isRibbonEnabled: boolean
//         isTooltipEnabled: boolean
//     }
//     handleRibbonToggle: (isRibbonEnabled: boolean) => any
//     handleTooltipToggle: (isTooltipEnabled: boolean) => any
//     highlightAll: (...args: any[]) => any
//     removeHighlights: () => any
//     highlightAndScroll: (...args: any[]) => any
//     makeHighlightMedium: (...args: any[]) => any
//     removeMediumHighlights: () => void
//     sortAnnotationByPosition: (...args: any[]) => any
//     removeAnnotationHighlights: (...args: any[]) => void
//     sidebarURL: string
// }

/* Temporary hack for props */
interface StateProps {
    isMouseHoveringOver: boolean
    isRibbonEnabled: boolean
    isTooltipEnabled: boolean
}

interface DispatchProps {
    openSidebar: ClickHandler<HTMLImageElement>
    handleRibbonToggle: ClickHandler<HTMLElement>
    handleTooltipToggle: ClickHandler<HTMLElement>
    handleRemoveRibbon: ClickHandler<HTMLElement>
}

interface OwnProps {}

type Props = StateProps & DispatchProps & OwnProps

class RibbonContainer extends React.Component<Props> {
    // private ribbonRef: HTMLElement

    // async componentDidMount() {
    // Get ribbon state.
    // const {
    //     isRibbonEnabled,
    //     isTooltipEnabled,
    // } = await this.props.getInitialState()
    // this.setState({ isRibbonEnabled, isTooltipEnabled })

    // this.setupRPCfunctions()

    // this.setupScrollListeners()

    // this.setupHoverListeners()

    // await this.fetchAnnotations()

    // // For hiding the ribbion when fullScreen event is fired
    // // For chrome
    // document.addEventListener(
    //     'webkitfullscreenchange',
    //     this.onFullScreenCall,
    //     false,
    // )
    // // For Firefox
    // document.addEventListener(
    //     'mozfullscreenchange',
    //     this.onFullScreenCall,
    //     false,
    // )

    // this.props.onInit({ toggleSidebar: () => this.toggleSidebar() })
    // }

    // componentDidUpdate(prevProps, prevState) {
    //     // If this update results in the iframe being rendered + prev state was not
    //     if (
    //         !prevState.shouldRenderIFrame &&
    //         !prevState.isSidebarActive &&
    //         this.state.shouldRenderIFrame
    //     ) {
    //         this.setupFrameFunctions()
    //     }
    // }

    // componentWillUnmount() {
    //     if (this.frameFC) {
    //         this.frameFC.removeMessageListener()
    //     }

    //     this.removeHoverListeners()
    // }

    // setupRPCfunctions = () => {
    //     makeRemotelyCallable({
    //         /**
    //          * Opens sidebar and displays the "New annotation" message above Comment Box.
    //          * @param {*} anchor The anchor of the selected text
    //          */
    //         openSidebarAndSendAnchor: async (anchor: Anchor) => {
    //             await this.openSidebarAndSendAnchor(anchor)

    //             const highlightables = this.state.annotations.filter(
    //                 annotation => annotation.selector,
    //             )
    //             this.props.highlightAll(highlightables)
    //         },
    //         /**
    //          * Gets called when "Go to annotation" icon is clicked in overview.
    //          * Highlights and scrolls to annotation, open sidebar and
    //          * focuses the annotation container.
    //          */
    //         goToAnnotation: async annotation => {
    //             await this.openSidebar()
    //             setTimeout(async () => {
    //                 const top = await this.props.highlightAndScroll(annotation)
    //                 this.setState({
    //                     top,
    //                     isInsideFrame: true,
    //                 })
    //                 this.frameFC.remoteExecute('focusAnnotation')(
    //                     annotation.url,
    //                 )
    //             }, 2000)
    //         },
    //         toggleIFrameRender: shouldRenderIFrame => {
    //             this.setState(state => {
    //                 if (!shouldRenderIFrame && !state.isSidebarActive) {
    //                     this.frameFC = null
    //                 }

    //                 return { shouldRenderIFrame }
    //             })
    //         },
    //     })
    // }

    // setupFrameFunctions = () => {
    //     this.frameFC = new FrameCommunication(this.iFrame.contentWindow)

    //     this.frameFC.setUpRemoteFunctions({
    //         toggleSidebar: async () => {
    //             await this.toggleSidebar()
    //         },
    //         highlightAndScroll: async annotation => {
    //             await this.highlightAndScroll(annotation)
    //         },
    //         makeHighlightMedium: annotation => {
    //             this.props.makeHighlightMedium(annotation)
    //         },
    //         removeMediumHighlights: () => {
    //             this.props.removeMediumHighlights()
    //         },
    //         deleteAnnotation: annotation => {
    //             this.props.removeAnnotationHighlights(annotation)
    //         },
    //         updateAnnotations: async () => {
    //             // Remove selection
    //             const selection = document.getSelection()
    //             selection.removeAllRanges()
    //             this.props.removeHighlights()
    //             await this.openSidebar()
    //         },
    //     })

    //     this.iFrame.addEventListener(
    //         'mouseenter',
    //         () => {
    //             this.setState({
    //                 isInsideFrame: true,
    //                 top: window.pageYOffset,
    //             })
    //         },
    //         false,
    //     )
    //     this.iFrame.addEventListener(
    //         'mouseleave',const styles = require('./ribbon.css')

    //         const arrowRibbon = browser.extension.getURL('/img/arrow_ribbon.svg')
    //         const logo = browser.extension.getURL('/img/worldbrain-logo-narrow.png')
    //         () => {
    //             this.setState({
    //                 isInsideFrame: false,
    //             })
    //         },
    //         false,
    //     )
    // }

    // setupScrollListeners() {
    //     document.addEventListener(
    //         'scroll',
    //         () => {
    //             const { top, isInsideFrame } = this.state
    //             if (isInsideFrame) {
    //                 window.scrollTo(0, top)
    //             }
    //         },
    //         false,
    //     )
    // }

    // setupHoverListeners() {
    //     this.ribbonRef.addEventListener('mouseenter', this.handleMouseEnter)
    //     this.ribbonRef.addEventListener('mouseleave', this.handleMouseLeave)
    // }

    // removeHoverListeners() {
    //     this.ribbonRef.removeEventListener('mouseenter', this.handleMouseEnter)
    //     this.ribbonRef.removeEventListener('mouseleave', this.handleMouseLeave)
    // }

    // updateState = ({ isRibbonEnabled, isTooltipEnabled }) => {
    //     this.setState({ isRibbonEnabled, isTooltipEnabled })
    // }

    // highlightAndScroll = async annotation => {
    //     const top = await this.props.highlightAndScroll(annotation)
    //     this.setState({
    //         isInsideFrame: false,
    //         top,
    //     })
    //     setTimeout(() => {
    //         this.setState({
    //             isInsideFrame: true,
    //         })
    //     }, 50)
    // }

    // fetchAnnotations = async () => {
    //     const annotations = await remoteFunction('getAllAnnotations')(
    //         window.location.href,
    //     )
    //     this.setState({
    //         annotations: annotations || [],
    //     })
    // }

    // focusAnnotationContainer = annotationUrl => {
    //     this.frameFC.remoteExecute('focusAnnotation')(annotationUrl)
    // }

    // hoverAnnotationContainer = annotationUrl => {
    //     this.frameFC.remoteExecute('setHoveredAnnotation')(annotationUrl)
    // }

    // closeSidebarOps = async () => {
    //     this.props.removeHighlights()
    //     this.frameFC.remoteExecute('focusAnnotation')('')
    //     this.frameFC.remoteExecute('setAnnotations')([])
    //     this.frameFC.remoteExecute('focusCommentBox')(false)
    // }

    // toggleSidebar = async () => {
    //     const isSidebarActive = !this.state.isSidebarActive
    //     const processEvent = remoteFunction('processEvent')

    //     if (processEvent) {
    //         processEvent({
    //             type: isSidebarActive ? 'openSidebarPage' : 'closeSidebarPage',
    //         })
    //     }

    //     if (isSidebarActive) {
    //         await this.openSidebar()
    //     } else {
    //         this.closeSidebarOps()
    //     }

    //     this.setState({
    //         isSidebarActive,
    //     })
    // }

    // /* Toggles tooltip on/off for all pages. */
    // toggleTooltip = async e => {
    //     e.stopPropagation()
    //     e.preventDefault()

    //     const { isTooltipEnabled } = this.state
    //     this.props.handleTooltipToggle(isTooltipEnabled)
    //     this.setState({ isTooltipEnabled: !isTooltipEnabled })
    // }

    // /* Toggles ribbon on/off for all pages. */
    // toggleRibbon = async e => {
    //     e.stopPropagation()
    //     e.preventDefault()

    //     const { isRibbonEnabled } = this.state
    //     this.props.handleRibbonToggle(isRibbonEnabled)
    //     this.setState({ isRibbonEnabled: !isRibbonEnabled })
    // }

    // openSidebar = () =>
    //     new Promise(resolve => {
    //         return this.setState(
    //             {
    //                 isSidebarActive: true,
    //                 shouldRenderIFrame: true,
    //             },
    //             async () => {
    //                 if (!this.frameFC) {
    //                     this.setupFrameFunctions()
    //                 }
    //                 await this.frameFC.remoteExecute('setLoaderActive')()
    //                 await this.fetchAnnotations()
    //                 const highlightables = this.state.annotations.filter(
    //                     annotation => annotation.selector,
    //                 )
    //                 await this.props.highlightAll(
    //                     highlightables,
    //                     this.focusAnnotationContainer,
    //                     this.hoverAnnotationContainer,
    //                 )
    //                 this.frameFC.remoteExecute('focusCommentBox')(true)

    //                 setTimeout(async () => {
    //                     const sorted = this.props.sortAnnotationByPosition(
    //                         this.state.annotations,
    //                     )
    //                     await this.frameFC.remoteExecute('setAnnotations')(
    //                         sorted,
    //                     )
    //                     resolve()
    //                 }, 400)
    //             },
    //         )
    //     })

    // openSidebarAndSendAnchor = async (anchor: Anchor) => {
    //     await this.openSidebar()

    //     setTimeout(
    //         () => this.frameFC.remoteExecute('sendAnchorToSidebar')(anchor),
    //         400,
    //     )
    // }

    // handleClickOutside = e => {
    //     if (!this.state.isSidebarActive) {
    //         return
    //     } else if (e.target.dataset.annotation) {
    //         return
    //     }
    //     this.closeSidebarOps()
    //     this.setState({
    //         isSidebarActive: false,
    //     })
    // }

    // onFullScreenCall = () => {
    //     const isFullScreenBool =
    //         (document as any).webkitIsFullScreen ||
    //         (document as any).mozIsFullScreen
    //             ? true
    //             : false
    //     this.setState({ isFullScreen: isFullScreenBool })
    // }

    // setiFrameRef = node => (this.iFrame = node)

    // renderIFrame() {
    //     if (!this.state.shouldRenderIFrame && !this.state.isSidebarActive) {
    //         return null
    //     }

    //     return (
    //         <iframe
    //             src={this.props.sidebarURL}
    //             height={window.innerHeight}
    //             id="memex_annotations_sidebar"
    //             ref={this.setiFrameRef}
    //             className={cx(styles.sidebarFrame, {
    //                 [styles.sidebarActive]: this.state.isSidebarActive,
    //             })}
    //         />
    //     )
    // }

    // handleMouseEnter = e => {
    //     e.stopPropagation()
    //     if (!this.state.isHovering) {
    //         this.setState({ isHovering: true })
    //     }
    // }

    // handleMouseLeave = e => {
    //     e.stopPropagation()
    //     if (this.state.isHovering) {
    //         this.setState({ isHovering: false })
    //     }
    // }

    // setRibbonRef = (ref: HTMLElement) => {
    //     this.ribbonRef = ref
    // }

    render() {
        return <Ribbon {...this.props} />
    }
}

const mapStateToProps: MapStateToProps<
    StateProps,
    OwnProps,
    RootState
> = state => ({
    isMouseHoveringOver: selectors.isMouseHoveringOver(state),
    isRibbonEnabled: selectors.isRibbonEnabled(state),
    isTooltipEnabled: selectors.isTooltipEnabled(state),
})

const mapDispatchToProps: MapDispatchToPropsFunction<
    DispatchProps,
    OwnProps
> = dispatch => ({
    openSidebar: () => null,
    handleRibbonToggle: () => null,
    handleTooltipToggle: () => null,
    handleRemoveRibbon: () => null,
})

// export default onClickOutside(RibbonContainer)
export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(RibbonContainer)
