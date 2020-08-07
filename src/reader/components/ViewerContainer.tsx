// import { actions as sidebarActs } from 'src/sidebar-overlay/sidebar'
// import Viewer from 'src/reader/components/Viewer'
// import { connect } from 'react-redux'
// import { insertTooltip, showContentTooltip } from 'src/in-page-ui/tooltip/content_script/interactions'
// import { SidebarActionOptions } from 'src/in-page-ui/shared-state/types'
// import { setupUIContainer } from 'src/in-page-ui/tooltip/content_script/components'
//
// const mapState = (state) => ({})
// const mapDispatch = (
//     dispatch,
// ) => ({
//     openSidebar: ({ activeUrl }) => {
//         dispatch(sidebarActs.setPageType('page'))
//         dispatch(
//             sidebarActs.openSidebar({
//                 url: activeUrl,
//                 title: '',
//                 forceFetch: true,
//             }),
//         )
//     },1
//     init: ({ eventsEmitter }) => {
//
//         const toolbarInPageUI = {
//             hideTooltip() {
//             },
//             removeTooltip() {
//             },
//             showSidebar(options?: SidebarActionOptions) {
//
//                 eventsEmitter.emit('sidebarAction',{action:'comment'})
//
//                 // Why did it appear to need this? where can we delete this from in other sources of reference
//                 // dispatch(sidebarActs.setPageType('page'))
//                 // dispatch(
//                 //     sidebarActs.openSidebar({
//                 //         url,
//                 //         title,
//                 //         forceFetch: true,
//                 //     }),
//                 // )
//             },
//             events: null,
//             showTooltip() {
//                 showContentTooltip(options)
//             }}
//
//             const options = {
//                 inPageUI: toolbarInPageUI,
//                 toolbarNotifications: null,
//                 annotationsManager: null,
//             }
//
//         insertTooltip(options)
//
//     },
// })
//
// export const ViewerContainer = connect(mapState, mapDispatch)(Viewer)
