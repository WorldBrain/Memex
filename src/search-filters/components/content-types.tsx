import React, { PureComponent } from 'react'
import { StateProps, DispatchProps } from './content-type-container'
import { Tooltip } from 'src/common-ui/components'
import ToggleSwitch from './toggle-switch'
import cx from 'classnames'

const styles = require('./content-types.css')

interface OwnProps {
    env: 'overview' | 'inpage'
    tooltipPosition: string
}

type Props = StateProps & DispatchProps & OwnProps

interface State {}

class ContentTypes extends PureComponent<Props, State> {
    private renderAnnotsTypes() {
        if (!this.props.isAnnotsSearch) {
            return null
        }

        return (
            <React.Fragment>
                <ToggleSwitch
                    value="Highlights"
                    active={this.props.highlightsFilter}
                    onClick={this.props.toggleHighlightsFilter}
                />
                <ToggleSwitch
                    value="Notes"
                    active={this.props.notesFilter}
                    onClick={this.props.toggleNotesFilter}
                />
            </React.Fragment>
        )
    }
    render() {
        return (
            <Tooltip position={this.props.tooltipPosition}>
                <div className={styles.container}>
                    {this.renderAnnotsTypes()}
                    {/*<ToggleSwitch
                        value="Highlights"
                        active={this.props.highlightsFilter}
                        onClick={this.props.toggleHighlightsFilter}
                    />
                    <ToggleSwitch
                        value="Notes"
                        active={this.props.notesFilter}
                        onClick={this.props.toggleNotesFilter}
                    />
                    <ToggleSwitch
                        value="Annotations"
                        active={this.props.annotationsFilter}
                        onClick={this.props.toggleAnnotationsFilter}
                    />
                    <ToggleSwitch
                        value="Websites"
                        active={this.props.websitesFilter}
                        onClick={this.props.toggleWebsitesFilter}
                    />
                     <ToggleSwitch
                        value="PDFs"
                        active={false}
                        onClick={() => null}
                    /> */}
                </div>
            </Tooltip>
        )
    }
}

export default ContentTypes
