// import * as React from 'react'
// import { Optionalize } from 'src/util/types'
// import { UserFeatureOptIn, UserFeatureOptInMap } from 'src/feature-opt-in/background/feature-opt-ins'
//
//
// interface NavigationDependencies { userOptInFeatures: UserFeatureOptInMap}
// export type NavigationDisplayChecker = (info: NavigationDependencies) => boolean;
//
// export function ifOptIn<P extends UserProps = UserProps>(
//     // tslint:disable-next-line:variable-name
//     WrappedComponent: React.ComponentType<P>,
//     optedInToFeatures: UserFeatureOptIn[],
// ) {
//     return class extends React.Component<Optionalize<P, UserProps>, UserProps> {
//         unsubscribe: () => void
//         constructor(props) {
//             super(props)
//             this.state = { currentUser: null, authorizedFeatures: [] }
//         }
//
//         componentDidMount = async () => {
//             this.setState({
//                 currentUser: await auth.getCurrentUser(),
//                 authorizedFeatures: await auth.getAuthorizedFeatures(),
//             })
//             const authEvents = getRemoteEventEmitter('auth')
//             authEvents.addListener(
//                 'onAuthStateChanged',
//                 this.listenOnAuthStateChanged,
//             )
//             this.unsubscribe = () =>
//                 authEvents.removeListener(
//                     'onAuthStateChanged',
//                     this.listenOnAuthStateChanged,
//                 )
//         }
//
//         listenOnAuthStateChanged = async user => {
//             this.setState({ currentUser: user })
//         }
//
//         componentWillUnmount = () => {
//             if (this.unsubscribe != null) {
//                 this.unsubscribe()
//             }
//         }
//
//         render() {
//             return (
//                 <WrappedComponent
//                     currentUser={this.state.currentUser}
//                     authorizedFeatures={this.state.authorizedFeatures}
//                     {...(this.props as P)}
//                 />
//             )
//         }
//     }
// }
