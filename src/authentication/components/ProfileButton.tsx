import * as React from 'react'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { MemexLogo } from 'src/common-ui/components/MemexLogo'
import { LOGIN_URL } from 'src/constants'
import { AuthContextInterface } from 'src/authentication/background/types'
const styles = require('./styles.css')

class ProfileButton extends React.PureComponent<AuthContextInterface> {
    handleClick = () => {
        window.location.href = LOGIN_URL
    }

    render() {
        return (
            <div className={styles.profileButton} onClick={this.handleClick}>
                <MemexLogo />
                {/* <span>{this.props.currentUser?.displayName}</span> */}
                <span className={styles.buttonText}> My Account </span>
            </div>
        )
    }
}
export default withCurrentUser(ProfileButton)
