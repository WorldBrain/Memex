import React, { ChangeEvent } from 'react'
import { Tag } from 'src/tags/background/types'
import { ActiveTab } from 'src/tags/ui/TagPicker/components/ActiveTab'

interface Props {
    tagsSelected: Tag[]
    onPress: (tag: Tag) => void
}
export class TagSelectedList extends React.PureComponent<Props> {
    _getTagAttr = event => ({
        name: event.target.getAttribute('data-tag-name'),
        url: event.target.getAttribute('data-tag-url'),
    })

    handleSelectedTabPress = (event: ChangeEvent) =>
        this.props.onPress(this._getTagAttr(event))

    render() {
        return (
            <React.Fragment>
                {this.props.tagsSelected?.map(tag => (
                    <ActiveTab
                        key={`ActiveTab-${tag.name}`}
                        data-tag-name={tag.name}
                        data-tag-url={tag.url}
                        onClick={this.handleSelectedTabPress}
                    >
                        {tag.name}
                    </ActiveTab>
                ))}
            </React.Fragment>
        )
    }
}
