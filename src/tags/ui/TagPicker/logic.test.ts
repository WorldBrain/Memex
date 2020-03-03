import { setupUiLogicTest } from 'src/util/ui-logic'
import logic, { INITIAL_STATE, TagPickerEvent } from './logic'

// see https://github.com/WorldBrain/Memex-Mobile/blob/develop/app/src/features/overview/ui/screens/dashboard/logic.test.ts
// see https://github.com/WorldBrain/Memex-Mobile/blob/7b74b83d3f3ebec793317c84222939d3fcba67b7/app/src/ui/index.tests.ts#L3

// describe('Tag Picker tetss', () => {
//
//     function setup(
//         options: Omit<Props, 'navigation'> & { navigation: FakeNavigation },
//     ) {
//         const logic = new Logic({
//             ...options,
//             navigation: options.navigation as any,
//         })
//         const element = new FakeStatefulUIElement<State, Event>(logic)
//
//         return { element }
//     }
//
//
//     test('It queries', async () => {
//         trigger.
//     }
// }
