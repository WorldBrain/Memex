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
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import {
    SyncSettingsStore,
    createSyncSettingsStore,
} from 'src/sync-settings/util'
import type { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'

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
        return this.props.shortcutsData.map(({ id, name, text, subText }) => {
            if (
                this.state[name] &&
                !(id === 'add-tag-shortcut' && !this.state.shouldShowTagsUIs)
            ) {
                return (
                    <CheckBoxRow>
                        <Checkbox
                            key={id}
                            id={id}
                            isChecked={this.state[name].enabled}
                            handleChange={this.handleEnabledToggle}
                            isDisabled={!this.state.shortcutsEnabled}
                            name={name}
                        >
                            <Title>
                                {text}{' '}
                                {subText && <SubText>({subText})</SubText>}
                            </Title>
                            <RightBox>
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
        })
    }

    render() {
        return (
            <Section>
                <SectionCircle>
                    <Icon
                        filePath={icons.atSign}
                        heightAndWidth="34px"
                        color="purple"
                        hoverOff
                    />
                </SectionCircle>
                <SectionTitle>Keyboard Shortcuts</SectionTitle>
                <InfoText>
                    You can also use shift, ctrl, alt, or meta to define
                    keyboard shortcuts.
                </InfoText>
                <Checkbox
                    id="shortcuts-enabled"
                    isChecked={this.state.shortcutsEnabled}
                    handleChange={this.handleEnabledToggle}
                    name="shortcutsEnabled"
                >
                    Enable Keyboard Shortcuts
                </Checkbox>
                {this.state.shortcutsEnabled && (
                    <CheckBoxContainer>
                        {this.renderCheckboxes()}
                    </CheckBoxContainer>
                )}
            </Section>
        )
    }
}

const RightBox = styled.div`
    display: flex;
    align-items: center;
    grid-auto-flow: column;
    grid-gap: 10px;
`

const Title = styled.span`
    display: flex;
    grid-gap: 5px;
    align-items: center;
`

const SubText = styled.span`
    color: ${(props) => props.theme.colors.normalText};
    padding-left: 5px;
`

const CheckBoxContainer = styled.div`
    margin-top: 30px;
    border-top: 1px solid ${(props) => props.theme.colors.lineGrey};
    padding-top: 10px;
    cursor: pointer;
`

const CheckBoxRow = styled.div`
    height: 50px;
`

const KeyboardInput = styled.input`
    background: ${(props) => props.theme.colors.backgroundColor};
    height: 40px;
    width: 120px;
    padding: 0 15px;
    align-items: center;
    justify-content: center;
    color: ${(props) => props.theme.colors.darkerText};
    border: 1px solid ${(props) => props.theme.colors.lineLightGrey};
    outline: none;
    text-align: center;
    border-radius: 5px;
`

const Section = styled.div`
    background: #ffffff;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.05);
    border-radius: 12px;
    padding: 50px;
    margin-bottom: 30px;
`

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.backgroundHighlight};
    border-radius: 100px;
    height: 80px;
    width: 80px;
    margin-bottom: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    margin-bottom: 40px;
    font-weight: 500;
`

export default KeyboardShortcutsContainer
