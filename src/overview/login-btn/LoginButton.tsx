import React, { Component } from 'react'
import { browser } from 'webextension-polyfill-ts'
import {
    UserProps,
    withCurrentUser,
} from 'src/authentication/components/AuthConnector'
import { features } from 'src/util/remote-functions-background'
import ProfileButton from 'src/authentication/components/ProfileButton'
import { MemexLogo } from 'src/common-ui/components/MemexLogo'
import { LOGIN_URL } from 'src/constants'

const styles = require('./login-btn.css')

export interface Props {}

export class LoginButton extends React.PureComponent<Props> {
    static defaultProps = {
        extVersion: browser.runtime.getManifest().version,
    }

    componentDidMount(): void {}

    handleClick = () => {
        window.location.href = LOGIN_URL
    }

    render() {
        return (
            <div className={styles.container} onClick={this.handleClick}>
                <MemexLogo />
                <span> Login to Memex.cloud </span>
            </div>
        )
    }
}

class LoginButtonContainer extends Component<UserProps, { optin: boolean }> {
    state = { optin: false }

    async componentDidMount() {
        this.setState({ optin: await features.getFeature('Auth') })
    }

    render() {
        if (this.state.optin === false) {
            return null
        }

        if (this.props.currentUser !== null) {
            return <ProfileButton {...this.props} />
        }

        return <LoginButton {...this.props} />
    }
}

export default withCurrentUser(LoginButtonContainer)
