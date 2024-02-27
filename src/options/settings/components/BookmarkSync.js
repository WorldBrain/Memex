import React from 'react'

import Checkbox from 'src/common-ui/components/Checkbox'
import styled from 'styled-components'
import SettingSection from '@worldbrain/memex-common/lib/common-ui/components/setting-section'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'

const BOOKMARK_SYNC_STORAGE_NAME = 'memex:settings:bookmarkSync'

class BookmarkSync extends React.Component {
    state = {
        bookmarkSync: true,
    }

    async componentDidMount() {
        const bookmarkSync = await getLocalStorage(BOOKMARK_SYNC_STORAGE_NAME)

        if (bookmarkSync === null) {
            await setLocalStorage(BOOKMARK_SYNC_STORAGE_NAME, true)
            this.setState({
                bookmarkSync: true,
            })
        } else {
            this.setState({
                bookmarkSync,
            })
        }
    }

    toggleBookmarkSync = async () => {
        const bookmarkSync = !this.state.bookmarkSync
        await setLocalStorage(BOOKMARK_SYNC_STORAGE_NAME, bookmarkSync)
        this.setState({ bookmarkSync })
    }

    render() {
        return (
            <SettingSection
                title={'Sync Browser Bookmarks'}
                description={
                    'Automatically add all pages to Memex that you bookmark via the browser native bookmark functions'
                }
                icon={'heartEmpty'}
            >
                <CheckBoxRow>
                    <Checkbox
                        id="autosync-bookmarks"
                        isChecked={this.state.bookmarkSync}
                        handleChange={this.toggleBookmarkSync}
                        label={'Enable'}
                    />
                </CheckBoxRow>
            </SettingSection>
        )
    }
}

const CheckBoxRow = styled.div`
    height: 50px;
    margin-left: -10px;
    padding: 10px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: fill-available;
    cursor: pointer;

    &:hover {
        outline: 1px solid ${(props) => props.theme.colors.greyScale3};
    }
`

export default BookmarkSync
