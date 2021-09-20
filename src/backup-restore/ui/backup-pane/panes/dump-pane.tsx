import React, { PureComponent } from 'react'
import classNames from 'classnames'

import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'

const settingsStyle = require('src/options/settings/components/settings.css')
const localStyles = require('./overview.css')

export interface Props {
    onDumpClick: React.MouseEventHandler
}

export class DumpPane extends PureComponent<Props> {
    render() {
        return (
            <div className={settingsStyle.section}>
                <div className={settingsStyle.sectionTitle}>Backup Status</div>
                <div className={localStyles.statusLine}>
                    <div>
                        <p
                            className={classNames(
                                settingsStyle.subname,
                                localStyles.limitWidth,
                            )}
                        >
                            Create a database dump of current state. Not
                            restoreable in other extensions.
                        </p>
                    </div>
                    <PrimaryAction
                        onClick={this.props.onDumpClick}
                        label="Create Dump"
                    />
                </div>
            </div>
        )
    }
}
