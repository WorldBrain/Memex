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
            <Tooltip 
                position={this.props.tooltipPosition}
                itemClass={cx({
                    [styles.typeTooltip]:
                        this.props.env === 'overview',
                })}
            >
                <div className={styles.typeBox}>
                    {this.renderAnnotsTypes()}
                </div>
            </Tooltip>
        )
    }
}

export default ContentTypes
