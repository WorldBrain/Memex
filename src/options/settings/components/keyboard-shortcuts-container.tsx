import * as React from 'react'

import { Checkbox } from '../../../common-ui/components'
import {
    convertKeyboardEventToKeyString,
    setKeyboardShortcutsState,
} from 'src/in-page-ui/keyboard-shortcuts/utils'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import { shortcuts, ShortcutElData } from '../keyboard-shortcuts'
import type { BaseKeyboardShortcuts } from 'src/in-page-ui/keyboard-shortcuts/types'
import analytics from 'src/analytics'
import { runInBackground } from 'src/util/webextensionRPC'
import { InPageUIInterface } from 'src/in-page-ui/background/types'
import styled from 'styled-components'
import {
    SyncSettingsStore,
    createSyncSettingsStore,
} from 'src/sync-settings/util'
import type { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import SettingSection from '@worldbrain/memex-common/lib/common-ui/components/setting-section'
import KeyboardShortcuts from '@worldbrain/memex-common/lib/common-ui/components/keyboard-shortcuts'

async function writeShortcutState(state: State) {
    await setKeyboardShortcutsState(state)
    await runInBackground<
        InPageUIInterface<'caller'>
    >().updateContextMenuEntries()
}

export interface Props {
    shortcutsData: ShortcutElData[]
    syncSettingsBG: RemoteSyncSettingsInterface
}

export interface State extends BaseKeyboardShortcuts {
    shouldShowTagsUIs: boolean
}

class KeyboardShortcutsContainer extends React.PureComponent<Props, State> {
    static defaultProps: Pick<Props, 'shortcutsData' | 'syncSettingsBG'> = {
        shortcutsData: shortcuts,
        syncSettingsBG: runInBackground(),
    }

    private syncSettings: SyncSettingsStore<'extension'>

    constructor(props: Props) {
        super(props)
        this.syncSettings = createSyncSettingsStore({
            syncSettingsBG: props.syncSettingsBG,
        })
    }

    state: State = {
        shouldShowTagsUIs: false,
        shortcutsEnabled: true,
        link: { shortcut: 'l', enabled: true },
        openDashboard: { shortcut: 'd', enabled: true },
        toggleSidebar: { shortcut: 'r', enabled: true },
        toggleHighlights: { shortcut: 'h', enabled: true },
        createAnnotation: { shortcut: 'a', enabled: true },
        createHighlight: { shortcut: 'n', enabled: true },
        addTag: { shortcut: 't', enabled: true },
        addComment: { shortcut: 'e', enabled: true },
        addToCollection: { shortcut: 'c', enabled: true },
        createBookmark: { shortcut: 'b', enabled: true },
        openToolTipInAIMode: { shortcut: 'x', enabled: true },
    }

    async componentDidMount() {
        const keyboardShortcutsState = await getKeyboardShortcutsState()
        const areTagsMigrated = await this.syncSettings.extension.get(
            'areTagsMigratedToSpaces',
        )
        this.setState({
            ...keyboardShortcutsState,
            shouldShowTagsUIs: !areTagsMigrated,
        })
    }

    handleEnabledToggle = async (e) => {
        const name = e.target.name as string
        const enabled = e.target.checked as boolean

        const reducer = (state) => {
            if (name === 'shortcutsEnabled') {
                analytics.trackEvent({
                    category: 'Settings',
                    action: enabled
                        ? 'enableKeyboardShortcuts'
                        : 'disableKeyboardShortcuts',
                })
                return { shortcutsEnabled: enabled }
            }
            return { [name]: { ...state[name], enabled } } as any
        }

        this.setState(reducer, () => writeShortcutState({ ...this.state }))
    }

    recordBinding: React.KeyboardEventHandler<HTMLInputElement> = async (e) => {
        e.preventDefault()

        const name = (e.target as HTMLInputElement).name as string

        // Afford way of clearing shortcut
        if (['Escape', 'Backspace'].includes(e.key)) {
            this.setState(
                (state) =>
                    ({ [name]: { ...state[name], shortcut: '' } } as any),
                () => writeShortcutState({ ...this.state }),
            )
            return
        }

        const shortcut = convertKeyboardEventToKeyString(e)

        if (!shortcut.length) {
            return
        }

        this.setState(
            (state) => ({ [name]: { ...state[name], shortcut } } as any),
            () => writeShortcutState({ ...this.state }),
        )
    }

    renderCheckboxes() {
        return this.props.shortcutsData.map(
            ({ id, name, text, subText }, i) => {
                if (
                    this.state[name] &&
                    !(
                        id === 'add-tag-shortcut' &&
                        !this.state.shouldShowTagsUIs
                    )
                ) {
                    const keysArray: [] = this.state[name].shortcut.split('+')
                    return (
                        <CheckBoxRow>
                            <Checkbox
                                key={id}
                                id={id}
                                isChecked={this.state[name].enabled}
                                handleChange={this.handleEnabledToggle}
                                isDisabled={!this.state.shortcutsEnabled}
                                name={name}
                                label={text.toString()}
                                zIndex={this.props.shortcutsData.length - i}
                            >
                                <RightBox>
                                    <Title>
                                        {subText && (
                                            <SubText>{subText}</SubText>
                                        )}
                                    </Title>
                                    <KeyBoardShortCutBehind>
                                        <KeyboardShortcuts keys={keysArray} />
                                    </KeyBoardShortCutBehind>
                                    <KeyboardInput
                                        type="text"
                                        value={this.state[name].shortcut}
                                        onKeyDown={this.recordBinding}
                                        onChange={(e) => e.preventDefault()}
                                        disabled={!this.state.shortcutsEnabled}
                                        name={name}
                                    />{' '}
                                </RightBox>
                            </Checkbox>
                        </CheckBoxRow>
                    )
                }
            },
        )
    }

    render() {
        return (
            <SettingSection
                icon={'command'}
                title={'Keyboard Shortcuts'}
                description={
                    'You can also use shift, ctrl, alt, or meta to define keyboard shortcuts.'
                }
            >
                <Checkbox
                    id="shortcuts-enabled"
                    isChecked={this.state.shortcutsEnabled}
                    handleChange={this.handleEnabledToggle}
                    name="shortcutsEnabled"
                    label={'Enable Keyboard Shortcuts'}
                />
                {this.state.shortcutsEnabled && (
                    <CheckBoxContainer>
                        {this.renderCheckboxes()}
                    </CheckBoxContainer>
                )}
            </SettingSection>
        )
    }
}

const RightBox = styled.div`
    display: flex;
    align-items: center;
    grid-auto-flow: column;
    grid-gap: 10px;
    flex: 1;
    justify-content: flex-end;
    position: relative;
    height: 40px;
    padding-right: 130px;
    color: ${(props) => props.theme.colors.white};
`

const KeyBoardShortCutBehind = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    height: 40px;
    width: 120px;
    top: 0px;
    right: 0px;
    border-radius: 8px;
    background: ${(props) => props.theme.colors.greyScale2};
`

const Title = styled.span`
    display: flex;
    grid-gap: 5px;
    align-items: center;
`

const SubText = styled.span`
    color: ${(props) => props.theme.colors.white};
    padding-left: 5px;
`

const CheckBoxContainer = styled.div`
    margin-top: 30px;
    border-top: 1px solid ${(props) => props.theme.colors.greyScale2};
    padding-top: 10px;
    cursor: pointer;
`

const CheckBoxRow = styled.div<{
    zIndex: number
}>`
    height: 50px;
    margin-left: -10px;
    padding: 10px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    z-index: ${(props) => props.zIndex};

    &:hover {
        outline: 1px solid ${(props) => props.theme.colors.greyScale3};
        z-index: ${(props) => props.zIndex};
    }
`

const KeyboardInput = styled.input`
    height: 40px;
    width: 120px;
    padding: 0 15px;
    align-items: center;
    justify-content: center;
    color: transparent;
    outline: none;
    text-align: center;
    border-radius: 8px;
    border: none;
    position: absolute;
    top: 0px;
    right: 0px;
    background: transparent;
    caret-color: transparent;

    &:focus {
        outline: 1px solid ${(props) => props.theme.colors.greyScale3};
    }
`

export default KeyboardShortcutsContainer
