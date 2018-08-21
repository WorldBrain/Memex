import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import ButtonIcon from '../../components/ButtonIcon'
import { RootState } from '../../types'
import * as constants from '../../../constants'
import * as selectors from '../selectors'
import * as acts from '../actions'

const styles = require('./NotifButton.css')

export interface OwnProps {
    href?: string
}

interface StateProps {
    unreadNotifCount: number
}

interface DispatchProps {
    initState: () => Promise<void>
}

type Props = OwnProps & StateProps & DispatchProps

class NotificationContainer extends PureComponent<Props> {
    static defaultProps: Pick<OwnProps, 'href'> = {
        href: `${constants.OVERVIEW_URL}?showInbox=true`,
    }

    componentDidMount() {
        this.props.initState()
    }

    render() {
        return (
            <ButtonIcon
                icon="notification"
                href={this.props.href}
                btnClass={styles.notification}
                badgeCount={this.props.unreadNotifCount}
            />
        )
    }
}

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = state => ({
    unreadNotifCount: selectors.notifCount(state),
})

const mapDispatch = (dispatch): DispatchProps => ({
    initState: () => dispatch(acts.initState()),
})

export default connect<StateProps, DispatchProps, OwnProps>(
    mapState,
    mapDispatch,
)(NotificationContainer)
