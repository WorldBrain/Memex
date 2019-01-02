import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import moment from 'moment'

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

interface State {
    mode: 'default' | 'edit' | 'delete'
}

class AnnotationsSectionContainer extends React.Component<Props, State> {
    state: State = {
        mode: 'default',
    }

    getFormattedTimestamp = (timestamp: Date) =>
        moment(timestamp)
            .format('MMMM D YYYY')
            .toUpperCase()

    getTruncatedTextObject: (
        text: string,
    ) => { isTextTooLong: boolean; text: string } = text => {
        if (text.length > 280) {
            const truncatedText = text.slice(0, 280) + ' [...]'
            return {
                isTextTooLong: true,
                text: truncatedText,
            }
        }

        for (let i = 0, newlineCount = 0; i < text.length; ++i) {
            if (text[i] === '\n') {
                newlineCount++
                if (newlineCount > 4) {
                    const truncatedText = text.slice(0, i) + ' [...]'
                    return {
                        isTextTooLong: true,
                        text: truncatedText,
                    }
                }
            }
        }

        return {
            isTextTooLong: false,
            text,
        }
    }

    shareIconClickHander = () => null

    replyIconClickHandler = () => null

    setMode = (mode: 'default' | 'edit' | 'delete') => null

    render() {
        const { isLoading, annotations } = this.props

        if (isLoading) {
            return <Loader />
        }

        if (!isLoading && annotations.length === 0) {
            return <EmptyMessage />
        }

        console.log(annotations)

        const { mode } = this.state

        return (
            <div className={styles.annotationsSection}>
                {annotations.map(annotation => (
                    <AnnotationBox
                        key={annotation.url}
                        mode={mode}
                        {...annotation}
                        getFormattedTimestamp={this.getFormattedTimestamp}
                        getTruncatedTextObject={this.getTruncatedTextObject}
                        shareIconClickHandler={this.shareIconClickHander}
                        replyIconClickHandler={this.replyIconClickHandler}
                        setMode={this.setMode}
                    />
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
