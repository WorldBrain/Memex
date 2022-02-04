import * as React from 'react'
import 'firebase/auth'
import { SignInScreen } from 'src/authentication/components/SignIn'
import AccountInfo from 'src/authentication/components/AccountInfo'
import AuthDialog from 'src/authentication/components/AuthDialog'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { LOGIN_URL } from 'src/constants'
import { AuthContextInterface } from 'src/authentication/background/types'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'
const styles = require('./styles.css')
import styled from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

interface Props {
    initiallyShowSubscriptionModal?: boolean
    refreshUser?: boolean
    showSubscriptionModal: () => void
}

class UserScreen extends React.Component<Props & AuthContextInterface> {
    async componentDidMount() {
        // N.B. when trying to move the `refreshUser` logic here from `AccountInfo` there are
        // inconsistent invocations when running on a new tab load vs navigation from existing page,
        // the RPC function does not seem to be registered in time for new loads

        if (this.props.initiallyShowSubscriptionModal) {
            this.props.showSubscriptionModal()
        }
    }

    render() {
        return (
            <>
                {this.props.currentUser === null ? (
                    <div>
                        <Section>
                            <SectionCircle>
                                <Icon
                                    filePath={icons.login}
                                    heightAndWidth="24px"
                                    color="purple"
                                    hoverOff
                                />
                            </SectionCircle>
                            <SectionTitle>Login or Signup</SectionTitle>
                            <AuthDialog
                                onAuth={() =>
                                    (window.location.href = LOGIN_URL)
                                }
                            />
                        </Section>
                    </div>
                ) : (
                    <AccountInfo refreshUser={this.props.refreshUser} />
                )}
            </>
        )
    }
}

const Section = styled.div`
    background: #ffffff;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.05);
    border-radius: 12px;
    padding: 50px;
    margin-bottom: 30px;
`

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.backgroundHighlight};
    border-radius: 100px;
    height: 80px;
    width: 80px;
    margin-bottom: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 30px;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    margin-bottom: 40px;
    font-weight: 500;
`

export default connect(null, (dispatch) => ({
    showSubscriptionModal: () => dispatch(show({ modalId: 'Subscription' })),
}))(withCurrentUser(UserScreen))
