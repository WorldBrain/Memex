import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import * as selectors from '../selectors'
import { MapDispatchToProps } from '../../types'
import { Annotation } from '../types'
import { RootState } from '../../ribbon-sidebar-controller'
import { Loader, EmptyMessage } from '../../components'
import AnnotationBox from './annotation-box'

const styles = require('./annotations-section-container.css')

interface StateProps {
    isLoading: boolean
    annotations: Annotation[]
}

interface DispatchProps {}

interface OwnProps {}

type Props = StateProps & DispatchProps & OwnProps

class AnnotationsSectionContainer extends React.Component<Props> {
    render() {
        const { isLoading, annotations } = this.props

        if (isLoading) {
            return <Loader />
        }

        if (!isLoading && annotations.length === 0) {
            return <EmptyMessage />
        }

        console.log(annotations)

        return (
            <div className={styles.annotationsSection}>
                {annotations.map(annotation => (
                    <AnnotationBox key={annotation.url} {...annotation} />
                ))}
            </div>
        )
    }
}

const mapStateToProps: MapStateToProps<
    StateProps,
    OwnProps,
    RootState
> = state => ({
    isLoading: selectors.isLoading(state),
    annotations: selectors.annotations(state),
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps
> = dispatch => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(AnnotationsSectionContainer)
