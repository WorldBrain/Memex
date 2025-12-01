import type {
    MemexTheme,
    MemexThemeVariant,
} from '@worldbrain/memex-common/ts/common-ui/styles/types'
import * as icons from 'src/common-ui/components/design-library/icons'
import { THEME } from '@worldbrain/memex-common/ts/common-ui/styles/theme'

export const theme = (options: { variant: MemexThemeVariant }) =>
    THEME({ icons, variant: options.variant })

export async function loadThemeVariant(): Promise<MemexThemeVariant> {
    const { themeVariant } = await chrome.storage.local.get('themeVariant')
    return themeVariant ? (themeVariant as MemexThemeVariant) : 'dark'
}
