import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import Button from '../../components/Button'
import { ClickHandler, RootState } from '../../types'
import * as acts from '../actions'
import * as popup from '../../selectors'

const styles = require('./CollectionsButton.css')

export interface OwnProps {}

interface StateProps {
    isDisabled: boolean
}

interface DispatchProps {
    toggleCollectionsPopup: ClickHandler<HTMLButtonElement>
    toggleAllTabsPopup: ClickHandler<HTMLButtonElement>
}

export type Props = OwnProps & StateProps & DispatchProps

class CollectionsButton extends PureComponent<Props> {
    render() {
        return (
            <React.Fragment>
                <Button
                    onClick={this.props.toggleCollectionsPopup}
                    disabled={this.props.isDisabled}
                    btnClass={styles.addToList}
                    itemClass={styles.button}
                >
                    Add To Collection(s)
                </Button>
                <span className={styles.spanbutton}>
                    <Button
                        onClick={this.props.toggleAllTabsPopup}
                        disabled={this.props.isDisabled}
                        btnClass={styles.allTabs}
                        title={'Add all tabs in this window to Collection(s)'}
                    />
                </span>
            </React.Fragment>
        )
    }
}

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = state => ({
    isDisabled: !popup.isLoggable(state),
})

const mapDispatch = (dispatch): DispatchProps => ({
    toggleCollectionsPopup: event => {
        event.preventDefault()
        dispatch(acts.setAllTabs(false))
        dispatch(acts.toggleShowTagsPicker())
    },
    toggleAllTabsPopup: event => {
        event.preventDefault()
        dispatch(acts.setAllTabs(true))
        dispatch(acts.toggleShowTagsPicker())
    },
})

export default connect<StateProps, DispatchProps, OwnProps>(
    mapState,
    mapDispatch,
)(CollectionsButton)
