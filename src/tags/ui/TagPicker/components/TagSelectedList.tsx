import React from 'react'
import { Tag } from 'src/tags/background/types'
import { ActiveTab } from 'src/tags/ui/TagPicker/components/ActiveTab'

interface Props {
    tagsSelected: Tag[]
    onPress: (tag: Tag) => void
}
export class TagSelectedList extends React.PureComponent<Props> {
    handleOnClick = tagName => this.props.onPress(tagName)

    render() {
        return (
            <React.Fragment>
                {this.props.tagsSelected?.map(tag => (
                    <ActiveTab
                        key={`ActiveTab-${tag.name}`}
                        onClick={() => this.handleOnClick(tag)}
                    >
                        {tag.name}
                    </ActiveTab>
                ))}
            </React.Fragment>
        )
    }
}
