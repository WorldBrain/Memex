import React, { PureComponent } from 'react'
import classNames from 'classnames'

import { PrimaryAction } from '@worldbrain/memex-common/ts/common-ui/components/PrimaryAction'

export interface Props {
    onDumpClick: React.MouseEventHandler
}

export class DumpPane extends PureComponent<Props> {
    render() {
        return (
            <div className="section">
                <div className="sectionTitle">Backup Status</div>
                <div className="statusLine">
                    <div>
                        <p className={classNames('subname', 'limitWidth')}>
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
