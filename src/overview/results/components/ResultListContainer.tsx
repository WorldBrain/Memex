import React, { PureComponent, MouseEventHandler, MouseEvent } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { RootState } from 'src/options/types'
const styles = require('./ResultList.css')

interface LocalState {}

export interface StateProps {}

export interface DispatchProps {}

export interface OwnProps {}

export type Props = StateProps & DispatchProps & OwnProps

class ResultListContainer extends PureComponent<Props, LocalState> {
    render() {
        return null
    }
}

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = (
    state,
) => ({})

const mapDispatch: (dispatch, props: OwnProps) => DispatchProps = (
    dispatch,
    props,
) => ({})

export default connect(mapState, mapDispatch)(ResultListContainer)
