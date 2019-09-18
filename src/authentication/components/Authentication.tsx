import * as React from 'react'
import { connect } from 'react-redux'
import Checkbox from 'src/common-ui/components/Checkbox'
const scriptjs = require('scriptjs')
import { createAction } from 'redux-act'
import { settings } from 'src/options/settings/selectors'
import { AuthService } from 'src/authentication/background/auth-service'
import { SubscriptionService } from 'src/authentication/background/subscription-service'
import {
    FirebaseChargebeeLinks,
    SubscriptionChargebeeFirebase,
} from 'src/authentication/background/subscription-chargebee-firebase'
import { AuthFirebase } from 'src/authentication/background/auth-firebase'
import {
    MockAuthImplementation,
    MockLinkGenerator,
} from 'src/authentication/background/mocks/auth-mocks'
import { Helmet } from 'react-helmet'
import { setCurrentUser } from 'src/authentication/redux'
import { auth } from 'src/util/remote-functions-background'
import Button from 'src/popup/components/Button'

const initBookmarks = createAction('index-prefs/init-bookmarks')

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
        const authService = new AuthService(MockAuthImplementation.newUser())
        const subService = new SubscriptionService(
            new SubscriptionChargebeeFirebase(
                new MockLinkGenerator(),
                this.chargebeeInstance,
            ),
            authService,
        )
        subService.checkout({ subscriptionPlanId: 'test' })
    }

    openCheckout = () => {}

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

                <Button onClick={() => this.props.openPortal()}>
                    Subscribe
                </Button>
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
