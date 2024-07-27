import React from 'react'
import styled, { css, createGlobalStyle } from 'styled-components'
import { RgbaColorPicker } from 'react-colorful'
import tinycolor from 'tinycolor2'
import {
    SyncSettingsStore,
    createSyncSettingsStore,
} from 'src/sync-settings/util'
import { UnifiedAnnotation } from 'src/annotations/cache/types'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { DEF_HIGHLIGHT_CSS_CLASS } from '@worldbrain/memex-common/lib/in-page-ui/highlighting/constants'
import { TaskState } from 'ui-logic-core/lib/types'
import { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import { RGBAColor } from '@worldbrain/memex-common/lib/annotations/types'
import { HIGHLIGHT_COLORS_DEFAULT } from '@worldbrain/memex-common/lib/common-ui/components/highlightColorPicker/constants'
import { HighlightColor } from '@worldbrain/memex-common/lib/common-ui/components/highlightColorPicker/types'
import {
    RGBAobjectToString,
    modifyDomHighlightColor,
} from '@worldbrain/memex-common/lib/common-ui/components/highlightColorPicker/utils'
import { color } from 'html2canvas/dist/types/css/types/color'
import KeyboardShortcuts from '@worldbrain/memex-common/lib/common-ui/components/keyboard-shortcuts'
import LoadingBlock from '@worldbrain/memex-common/lib/common-ui/components/loading-block'

export interface Props {
    annotationId: string
    selectedColor: HighlightColor['id']
    syncSettingsBG: RemoteSyncSettingsInterface
    updateAnnotationColor: (color: HighlightColor['id']) => Promise<void>
}

export interface State {
    showEditColor: boolean[]
    labelEditState: boolean[]
    highlightColorSettingState: HighlightColor[]
    highlightColorSettingLoadState: TaskState
    showColorEditorPanel: boolean
    selectedRow: number
    highlightColorStateChanged: boolean
    colorInputValue: string | null
}

export default class HighlightColorPicker extends React.Component<
    Props,
    State,
    Event
> {
    syncSettings: SyncSettingsStore<'highlightColors'>
    editButtonRef: React.RefObject<HTMLDivElement>[]
    labelEditFieldRef: React.RefObject<HTMLInputElement>[]

    constructor(props: Props) {
        super(props)
        this.labelEditFieldRef = []
        this.editButtonRef = []
        this.syncSettings = createSyncSettingsStore({
            syncSettingsBG: this.props.syncSettingsBG,
        })
    }

    state: State = {
        showEditColor: [],
        labelEditState: [],
        highlightColorSettingState: null,
        highlightColorSettingLoadState: null,
        showColorEditorPanel: false,
        selectedRow: null,
        highlightColorStateChanged: false,
        colorInputValue: null,
    }

    async componentDidMount() {
        const originalSetState = this.setState.bind(this)
        this.setState = (updates) => {
            originalSetState(updates)
        }

        this.setState({
            highlightColorSettingLoadState: 'running',
        })

        const highlightColorSettings = await this.getHighlightColorSettings()
        const colorDefault = highlightColorSettings.find(
            (color) => color.id === this.props.selectedColor,
        ).color

        this.editButtonRef = []
        if (highlightColorSettings) {
            let selectedRow = 0

            for (let item of highlightColorSettings) {
                if (
                    JSON.stringify(item.color) === JSON.stringify(colorDefault)
                ) {
                    break
                }
                selectedRow += 1

                if (selectedRow === highlightColorSettings.length - 1) {
                    selectedRow = highlightColorSettings.length
                }
            }

            this.setState({
                highlightColorSettingLoadState: 'success',
                highlightColorSettingState: [...highlightColorSettings],
                selectedRow,
            })
        }

        for (let i = 0; i < 5; i++) {
            this.editButtonRef[i] = React.createRef()
            this.labelEditFieldRef[i] = React.createRef()
        }
    }

    componentWillUnmount(): void {
        // if (this.state.highlightColorStateChanged) {
        //     this.saveHighlightColorSettings()
        // }
    }

    getHighlightColorSettings = async (forceUpdate?) => {
        let highlightColors = this.state.highlightColorSettingState
        if (!highlightColors || forceUpdate) {
            highlightColors = await this.syncSettings.highlightColors.get(
                'highlightColors',
            )
            if (!highlightColors) {
                highlightColors = [...HIGHLIGHT_COLORS_DEFAULT]
            }
        }
        this.setState({
            highlightColorSettingState: highlightColors,
            highlightColorSettingLoadState: 'success',
        })

        return highlightColors
    }

    updateHighlightColor = async (color: HighlightColor) => {
        let highlights: NodeListOf<Element> = document.querySelectorAll(
            '.' + DEF_HIGHLIGHT_CSS_CLASS,
        )

        let filteredHighlights = Array.from(highlights).filter((highlight) => {
            return highlight.classList.contains(
                `memex-highlight-${this.props.annotationId}`,
            )
        })

        for (let element of filteredHighlights) {
            modifyDomHighlightColor(element, color)
        }
        await this.props.updateAnnotationColor(color.id)
    }

    saveHighlightColorSettings = async () => {
        let highlights: NodeListOf<Element> = document.querySelectorAll(
            '.' + DEF_HIGHLIGHT_CSS_CLASS,
        )

        for (let colorItem of this.state.highlightColorSettingState) {
            const filteredHighlights = Array.from(highlights).filter(
                (highlight) => {
                    return (
                        highlight.getAttribute('highlightcolor') ===
                        colorItem.id
                    )
                },
            )
            for (let highlight of filteredHighlights) {
                modifyDomHighlightColor(highlight, colorItem)
            }
        }
        this.setState({
            highlightColorSettingState: this.state.highlightColorSettingState,
        })

        await this.syncSettings.highlightColors.set(
            'highlightColors',
            this.state.highlightColorSettingState,
        )
    }

    renderColorPicker(
        updatedColor,
        pickerColor,
        label,
        index: number,
        disabled,
    ) {
        return (
            <ColorEditBox
                onClick={(event) => {
                    event.stopPropagation()
                }}
                key={'ColorEditBox' + index}
            >
                <TopBarBox>
                    <PrimaryAction
                        label={'Cancel'}
                        onClick={async (event) => {
                            let highlights: NodeListOf<Element> = document.querySelectorAll(
                                '.' + DEF_HIGHLIGHT_CSS_CLASS,
                            )

                            for (let item of (highlights as any) as HTMLElement[]) {
                                const existingStyle = item.getAttribute(
                                    'highlightcolor',
                                )

                                let color = null
                                if (existingStyle) {
                                    color = this.state.highlightColorSettingState.find(
                                        (color) => color.id === existingStyle,
                                    ).color
                                    color = RGBAobjectToString(color)
                                }

                                item.setAttribute(
                                    'style',
                                    `background-color:${color};`,
                                )
                            }
                            const newShowEditColor = [
                                ...this.state.showEditColor,
                            ]

                            this.getHighlightColorSettings(true)
                            newShowEditColor[index] = false
                            this.setState({
                                showColorEditorPanel: false,
                                showEditColor: newShowEditColor,
                            })
                            event.stopPropagation()
                        }}
                        size={'small'}
                        type={'tertiary'}
                        icon={'removeX'}
                        padding={'2px 6px 2px 0px'}
                    />
                    <PrimaryAction
                        label={'Save Color'}
                        onClick={(event) => {
                            const newShowEditColor = [
                                ...this.state.showEditColor,
                            ]
                            newShowEditColor[index] = false
                            this.setState({
                                showEditColor: newShowEditColor,
                                showColorEditorPanel: false,
                                colorInputValue: null,
                            })
                            this.saveHighlightColorSettings()
                            event.stopPropagation()
                        }}
                        size={'small'}
                        type={'primary'}
                        icon={'check'}
                        padding={'2px 6px 2px 0px'}
                    />
                </TopBarBox>
                {!disabled && (
                    <SpaceTitleEditField
                        ref={this.labelEditFieldRef[index] ?? null}
                        value={
                            this.state.highlightColorSettingState[index][
                                'label'
                            ] ?? label
                        }
                        disabled={disabled}
                        autoFocus
                        isActivated={this.state.labelEditState[index]}
                        onClick={() => {
                            let newLabelEditState = [
                                ...this.state.labelEditState,
                            ] // create a copy of labelState

                            if (!this.state.labelEditState) {
                                newLabelEditState[index] = true
                                this.setState({
                                    labelEditState: newLabelEditState,
                                })
                            } else {
                                this.labelEditFieldRef[
                                    index
                                ]?.current.addEventListener('blur', () =>
                                    this.handleClickOutside(index),
                                )
                            }
                        }}
                        onChange={(event) => {
                            {
                                let newHighlightColorSettingState = this.state.highlightColorSettingState.map(
                                    (i) => {
                                        return JSON.parse(JSON.stringify(i))
                                    },
                                )

                                newHighlightColorSettingState[index]['label'] =
                                    event.target.value

                                // modify the copy
                                this.setState({
                                    highlightColorSettingState: newHighlightColorSettingState,
                                })
                            }
                        }}
                    />
                )}

                <HexPickerContainer>
                    <RgbaColorPicker
                        color={pickerColor}
                        onChange={(value) => {
                            {
                                this.setState({
                                    highlightColorStateChanged: true,
                                })
                                let newHighlightColorSettingState = this.state
                                    .highlightColorSettingState

                                const existingColor =
                                    newHighlightColorSettingState[index][
                                        'color'
                                    ]

                                let highlights: NodeListOf<Element> = document.querySelectorAll(
                                    '.' + DEF_HIGHLIGHT_CSS_CLASS,
                                )

                                for (let item of (highlights as any) as HTMLElement[]) {
                                    const existingStyle =
                                        item.style.backgroundColor
                                    let backgroundColor = ''

                                    if (existingStyle.startsWith('rgb(')) {
                                        backgroundColor = item.style.backgroundColor
                                            .replace(')', ', 1)')
                                            .replace('rgb(', 'rgba(')
                                    } else if (
                                        existingStyle.startsWith('rgba(')
                                    ) {
                                        backgroundColor = existingStyle
                                    }
                                    if (
                                        backgroundColor ===
                                        RGBAobjectToString(existingColor)
                                    ) {
                                        item.setAttribute(
                                            'style',
                                            `background-color:${RGBAobjectToString(
                                                value,
                                            )};`,
                                        )
                                    }
                                }
                                newHighlightColorSettingState[index][
                                    'color'
                                ] = value
                                this.setState({
                                    highlightColorSettingState: newHighlightColorSettingState,
                                })
                            }
                        }}
                    />
                </HexPickerContainer>
                <TextField
                    value={
                        this.state.colorInputValue ??
                        tinycolor(
                            this.state.highlightColorSettingState[index][
                                'color'
                            ],
                        ).toHex8String()
                    }
                    onChange={(event) => {
                        const inputValue = (event.target as HTMLInputElement)
                            .value

                        // Validate the input value
                        if (tinycolor(inputValue).isValid()) {
                            this.setState({
                                highlightColorStateChanged: true,
                            })
                            let newHighlightColorSettingState = [
                                ...this.state.highlightColorSettingState,
                            ]

                            newHighlightColorSettingState[index][
                                'color'
                            ] = tinycolor(inputValue).toRgb()

                            // modify the copy
                            this.setState({
                                highlightColorSettingState: newHighlightColorSettingState,
                                colorInputValue: (event.target as HTMLInputElement)
                                    .value,
                            })
                        } else {
                            this.setState({
                                colorInputValue: (event.target as HTMLInputElement)
                                    .value,
                            })
                        }
                    }}
                />
            </ColorEditBox>
        )
    }

    handleClickOutside(i) {
        let newLabelEditState = [...this.state.labelEditState]
        newLabelEditState[i] = false
        this.setState({
            labelEditState: newLabelEditState,
        })
    }
    handleColorPickerEditState(i) {
        let newShowEditColorState = [...this.state.showEditColor] // create a copy of labelState
        newShowEditColorState[i] = false // modify the copy
        this.setState({ showEditColor: newShowEditColorState })
    }

    render() {
        if (
            this.state.highlightColorSettingLoadState == null ||
            this.state.highlightColorSettingLoadState === 'running'
        ) {
            return <LoadingBlock size={22} width={'230px'} height={'208px'} />
        } else {
            try {
                const settings = this.state.highlightColorSettingState

                return (
                    <MenuContainer>
                        <GlobalStyle />
                        {Object.entries(settings).map((setting, i) => {
                            const colorId = setting[1]['id']
                            const color = setting[1]['color']
                            let label = ''

                            if (settings[i]['id'] === 'default') {
                                label = 'Default Color'
                            } else {
                                label = setting[1]['label'] ?? 'Color ' + i
                            }

                            if (this.state.showEditColor[i]) {
                                return this.renderColorPicker(
                                    color,
                                    color,
                                    label,
                                    i,
                                    settings[i]['id'] === 'default',
                                )
                            } else if (!this.state.showColorEditorPanel) {
                                return (
                                    <SettingsRow
                                        onMouseDown={() => {
                                            this.updateHighlightColor(
                                                setting[1],
                                            )
                                        }}
                                        active={this.state.showEditColor[i]}
                                        selected={this.state.selectedRow === i}
                                        key={colorId}
                                    >
                                        <ColorPickerCircle
                                            backgroundColor={RGBAobjectToString(
                                                color,
                                            )}
                                            ref={this.editButtonRef[i]}
                                        />
                                        <ColorPickerLabel>
                                            {label}
                                        </ColorPickerLabel>
                                        <HotkeyNumber>
                                            <KeyboardShortcuts
                                                keys={[(i + 1).toString()]}
                                                size="medium"
                                            />
                                        </HotkeyNumber>
                                        <EditIconBox
                                            ref={this.editButtonRef[i]}
                                            onMouseDown={(event) => {
                                                event.stopPropagation()
                                                const newShowEditColor = [
                                                    ...this.state.showEditColor,
                                                ]
                                                newShowEditColor[i] = true
                                                this.setState({
                                                    showEditColor: newShowEditColor,
                                                    showColorEditorPanel: true,
                                                })
                                            }}
                                        >
                                            <Icon
                                                icon={'edit'}
                                                heightAndWidth={'20px'}
                                                color={'greyScale6'}
                                            />
                                        </EditIconBox>
                                    </SettingsRow>
                                )
                            }
                        })}
                    </MenuContainer>
                )
            } catch (e) {
                console.error('Parsing error:', e)
            }
        }
    }
}

const TopBarBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
`

const ColorEditBox = styled.div`
    padding: 10px;
    display: flex;
    flex-direction: column;
    grid-gap: 10px;
    align-items: flex-end;
`

const EditIconBox = styled.div`
    position: absolute;
    right: 3px;
    display: none;
    background: ${(props) => props.theme.colors.greyScale2};
`
const HotkeyNumber = styled.div`
    position: absolute;
    right: 3px;
    display: flex;
    font-size: 14px;
    margin-left: 10px;
    width: 20px;
    border-radius: 3px;
    justify-content: center;
`

const MenuContainer = styled.div`
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    width: fit-content;
    padding: 15px;
    min-width: 200px;
`

const HexPickerContainer = styled.div`
    height: 200px;
    width: 200px;

    > * {
        width: initial;
    }
`

const SettingsRow = styled.div<{ active; selected }>`
    height: 40px;
    display: flex;
    grid-gap: 10px;
    align-items: center;
    padding: 0px 10px;
    min-width: 30%;
    flex: 1;
    position: relative;
    cursor: pointer;
    border-radius: 5px;

    &:hover ${EditIconBox} {
        display: flex;
    }
    &:hover ${HotkeyNumber} {
        display: none;
    }
    &:hover {
        border-radius: 5px;
        outline: 1px solid ${(props) => props.theme.colors.greyScale3};
    }

    ${(props) =>
        props.active &&
        css`
            background: ${(props) => props.theme.colors.greyScale2};
        `}
    ${(props) =>
        props.selected &&
        css`
            background: ${(props) => props.theme.colors.greyScale2};
        `}
`

const ColorPickerLabel = styled.div`
    font-size: 14px;
    color: ${(props) =>
        props.theme.variant === 'dark'
            ? props.theme.colors.greyScale7
            : props.theme.colors.greyScale6};
`

const ColorPickerCircle = styled.div<{ backgroundColor: string }>`
    height: 18px;
    width: 18px;
    background-color: ${(props) => props.backgroundColor};
    border-radius: 50px;
    margin: 5px;
    border: 1px solid ${(props) => props.theme.colors.greyScale3};
`

const SpaceTitleEditField = styled.input<{
    isActivated?: boolean
    isCreator?: boolean
    disabled?: boolean
}>`
    font-size: 14px;
    font-weight: 500;
    height: 44px;
    flex: 1;
    width: fill-available;
    color: ${(props) =>
        props.theme.variant === 'dark'
            ? props.theme.colors.greyScale7
            : props.theme.colors.greyScale6};
    letter-spacing: 1px;
    background: ${(props) => props.theme.colors.greyScale2};
    border-radius: 5px;
    padding: 10px;
    outline: 1px solid ${(props) => props.theme.colors.greyScale4};
    font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on;
    border: none;

    ${(props) =>
        !props.isActivated &&
        css`
            font-size: 14px;
            font-weight: 500;
            width: fill-available;
            color: ${(props) =>
                props.theme.variant === 'dark'
                    ? props.theme.colors.greyScale7
                    : props.theme.colors.greyScale6};
            background: transparent;
            letter-spacing: 1px;
            padding: 10px;
            border-radius: 5px;
            outline: 1px solid ${(props) => props.theme.colors.greyScale3};
            font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on,
                'ss04' on;
            border: none;

            &:hover {
                cursor: pointer;
                background: ${(props) => props.theme.colors.greyScale2};
            }
        `};
    ${(props) =>
        props.disabled &&
        css`
            outline: none;
            background: none;
            cursor: default;
            &:hover {
                cursor: pointer;
                background: none;
            }
        `};
`

const LoadingBox = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
`

const TopSection = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    grid-gap: 5px;
    color: ${(props) => props.theme.colors.white};
`

export const GlobalStyle = createGlobalStyle`

.react-colorful {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 200px;
    height: 200px;
    user-select: none;
    cursor: default;
  }

  .react-colorful__saturation {
    position: relative;
    flex-grow: 1;
    border-color: transparent; /* Fixes https://github.com/omgovich/react-colorful/issues/139 */
    border-bottom: 12px solid #000;
    border-radius: 8px 8px 0 0;
    background-image: linear-gradient(to top, #000, rgba(0, 0, 0, 0)),
      linear-gradient(to right, #fff, rgba(255, 255, 255, 0));
  }

  .react-colorful__pointer-fill,
  .react-colorful__alpha-gradient {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    border-radius: inherit;
  }

  /* Improve elements rendering on light backgrounds */
  .react-colorful__alpha-gradient,
  .react-colorful__saturation {
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
  }

  .react-colorful__hue,
  .react-colorful__alpha {
    position: relative;
    height: 24px;
  }

  .react-colorful__hue {
    background: linear-gradient(
      to right,
      #f00 0%,
      #ff0 17%,
      #0f0 33%,
      #0ff 50%,
      #00f 67%,
      #f0f 83%,
      #f00 100%
    );
  }

  .react-colorful__last-control {
    border-radius: 0 0 8px 8px;
  }

  .react-colorful__interactive {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    border-radius: inherit;
    outline: none;
    /* Don't trigger the default scrolling behavior when the event is originating from this element */
    touch-action: none;
  }

  .react-colorful__pointer {
    position: absolute;
    z-index: 1;
    box-sizing: border-box;
    width: 28px;
    height: 28px;
    transform: translate(-50%, -50%);
    background-color: #fff;
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .react-colorful__interactive:focus .react-colorful__pointer {
    transform: translate(-50%, -50%) scale(1.1);
  }

  /* Chessboard-like pattern for alpha related elements */
  .react-colorful__alpha,
  .react-colorful__alpha-pointer {
    background-color: #fff;
    background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill-opacity=".05"><rect x="8" width="8" height="8"/><rect y="8" width="8" height="8"/></svg>');
  }

  /* Display the saturation pointer over the hue one */
  .react-colorful__saturation-pointer {
    z-index: 3;
  }

  /* Display the hue pointer over the alpha one */
  .react-colorful__hue-pointer {
    z-index: 2;
  }

`
