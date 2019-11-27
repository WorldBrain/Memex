import * as React from 'react'
import {
    UserProps,
    withCurrentUser,
} from 'src/authentication/components/AuthConnector'
import { MemexLogo } from 'src/common-ui/components/MemexLogo'
import { LOGIN_URL } from 'src/constants'
const styles = require('./styles.css')

class ProfileButton extends React.PureComponent<UserProps> {
    handleClick = () => {
        window.location.href = LOGIN_URL
    }

    render() {
        return (
            <div className={styles.profileButton} onClick={this.handleClick}>
                <MemexLogo />
                <span>{this.props.currentUser.displayName}</span>
            </div>
        )
    }
}
export default withCurrentUser(ProfileButton)
