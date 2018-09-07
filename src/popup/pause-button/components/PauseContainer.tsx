import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import { ClickHandler, RootState } from '../../types'
import * as selectors from '../selectors'
import * as acts from '../actions'
import PauseButton from './PauseButton'
import PauseSelect from './PauseSelect'

export interface OwnProps {
    pauseValues?: number[]
}

interface StateProps {
    pauseTime: number
    isPaused: boolean
}

interface DispatchProps {
    initState: () => Promise<void>
    togglePause: ClickHandler<HTMLDivElement>
    onTimeChange: ClickHandler<HTMLSelectElement>
}

export type Props = OwnProps & StateProps & DispatchProps

class HistoryPauser extends PureComponent<Props> {
    static defaultProps: Pick<OwnProps, 'pauseValues'> = {
        pauseValues: [5, 10, 20, 30, 60, 120, 180, Infinity],
    }

    componentDidMount() {
        this.props.initState()
    }

    private renderPauseChoices() {
        return this.props.pauseValues.map((val, i) => (
            <option key={i} value={val}>
                {val === Infinity ? '∞' : val}
            </option>
        ))
    }

    private renderBodyContent() {
        if (this.props.isPaused) {
            return 'Indexing paused'
        }

        return (
            <PauseSelect {...this.props}>
                {this.renderPauseChoices()}
            </PauseSelect>
        )
    }

    render() {
        return (
            <PauseButton {...this.props}>
                {this.renderBodyContent()}
            </PauseButton>
        )
    }
}

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = state => ({
    isPaused: selectors.isPaused(state),
    pauseTime: selectors.pauseTime(state),
})

const mapDispatch = (dispatch): DispatchProps => ({
    initState: () => dispatch(acts.init()),
    togglePause: event => {
        event.preventDefault()
        dispatch(acts.togglePaused())
    },
    onTimeChange: event => {
        const el = event.target as HTMLSelectElement
        dispatch(acts.setTimeout(+el.value))
    },
})

export default connect<StateProps, DispatchProps, OwnProps>(
    mapState,
    mapDispatch,
)(HistoryPauser)
