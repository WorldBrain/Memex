import * as React from 'react'
import { AuthContextInterface } from 'src/authentication/background/types'
import { Optionalize } from 'src/util/types'
import { AuthContext } from './AuthContextProvider'

export function withCurrentUser<
    P extends AuthContextInterface = AuthContextInterface
>(WrappedComponent: React.ComponentType<P>) {
    return class extends React.Component<
        Optionalize<P, AuthContextInterface>,
        AuthContextInterface
    > {
        render() {
            return (
                <AuthContext.Consumer>
                    {(context) => (
                        <WrappedComponent
                            currentUser={context?.currentUser}
                            loadingUser={context?.loadingUser}
                            {...(this.props as P)}
                        />
                    )}
                </AuthContext.Consumer>
            )
        }
    }
}
