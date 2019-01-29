import React, { PureComponent } from 'react'
import CheckmarkRow from './checkmark-row'

class ContentTypes extends PureComponent {
    render() {
        return (
            <div>
                <CheckmarkRow
                    value="Annotations"
                    subtitle="Highlights including notes"
                    active={false}
                    onClick={() => null}
                />
                <CheckmarkRow
                    value="Highlights"
                    subtitle="Only highlighted text"
                    active={false}
                    small
                    onClick={() => null}
                />
                <CheckmarkRow
                    value="Notes"
                    subtitle="Only the content of Notes"
                    active={false}
                    small
                    onClick={() => null}
                />
                <CheckmarkRow
                    value="Websites"
                    subtitle="All your visited web history"
                    active={false}
                    onClick={() => null}
                />
                <CheckmarkRow
                    value="PDFs"
                    subtitle="All your visited PDFs"
                    active={false}
                    onClick={() => null}
                />
            </div>
        )
    }
}

export default ContentTypes
