import * as React from 'react'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import { setCurrentUser } from 'src/authentication/redux'
import { auth, subscription } from 'src/util/remote-functions-background'
import Button from 'src/popup/components/Button'

const chargeBeeScriptSource = 'https://js.chargebee.com/v2/chargebee.js'

interface Props {
    currentUser: any
    setUser: any
}

interface State {
    currentUser: any
}

class Authentication extends React.PureComponent<Props, State> {
    chargebeeInstance: any

    state = { currentUser: null }

    componentDidMount = async () => {
        // scriptjs.ready(chargeBeeScriptSource, () => {
        //     this._initChargebee()
        // })
        const user = await auth.getUser()
        this.setState({ currentUser: user })
    }

    _initChargebee = (): void => {
        if (this.chargebeeInstance != null) {
            return
        }
        if (window['Chargebee'] == null) {
            return console.error(
                'Could not load payment provider as external script is not currently loaded.',
            )
        }
        this.chargebeeInstance = window['Chargebee'].init({
            site: 'wbstaging-test',
        })
    }

    openPortal = () => {
        this._initChargebee()
        subscription.manage(this.chargebeeInstance)
    }

    openCheckout = () => {
        this._initChargebee()
        subscription.checkout(
            { subscriptionPlanId: 'test' },
            this.chargebeeInstance,
        )
    }

    render() {
        return (
            <div className={''}>
                <Helmet>
                    <script src={chargeBeeScriptSource} />
                </Helmet>
                <h1 className={''}>hi user</h1>
                <h1 className={''}>CurrentUser: {this.props.currentUser}</h1>
                <h1 className={''}>
                    CurrentUser:{' '}
                    {this.state.currentUser != null
                        ? this.state.currentUser.id
                        : ''}
                </h1>
                <Button onClick={() => this.props.setUser()}>WIP</Button>

                <Button onClick={() => this.openCheckout()}>Subscribe</Button>

                <Button onClick={() => this.openPortal()}>Manage</Button>
            </div>
        )
    }
}

const mapStateToProps = (state): any => ({
    currentUser: state.auth.currentUser,
})

const mapDispatchToProps = (dispatch): any => ({
    setUser: () => dispatch(setCurrentUser('hi')),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Authentication)

class UserContainer extends React.PureComponent {
    // If user is logged in (get from redux store) show User Info
    // If user is not logged in (get from redux store) show Login
}

class Login extends React.PureComponent {}

class UserInfo extends React.PureComponent {}

/*

import { State } from '../../options/settings/reducer'
export const bookmarks = createSelector(settings, state => state.bookmarks)
import { createSelector } from 'reselect'
*/
