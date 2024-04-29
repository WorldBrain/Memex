import type {
    MemexTheme,
    MemexThemeVariant,
} from '@worldbrain/memex-common/lib/common-ui/styles/types'
import * as icons from 'src/common-ui/components/design-library/icons'
import { THEME } from '@worldbrain/memex-common/lib/common-ui/styles/theme'
import browser from 'webextension-polyfill'

export const theme = (options: { variant: MemexThemeVariant }) =>
    THEME({ icons, variant: options.variant })

export async function loadThemeVariant(): Promise<MemexThemeVariant> {
    const { themeVariant } = await browser.storage.local.get('themeVariant')
    return themeVariant ? (themeVariant as MemexThemeVariant) : 'dark'
}
