import { BackgroundIntegrationTestSuite } from './integration-tests'
import { registerBackgroundIntegrationTest } from './background-integration-tests'

const path = require('path')
const requireContext = require('require-context')

const backgroundTestModules = requireContext(
    path.join(__dirname, '..'),
    /* useSubdirectories = */ true,
    /background\/index.tests.ts/,
)

for (const modulePath of backgroundTestModules.keys()) {
    const backgroundTestModule = backgroundTestModules(modulePath)

    const integrationTestSuite = backgroundTestModule.INTEGRATION_TESTS as BackgroundIntegrationTestSuite
    if (!integrationTestSuite) {
        continue
    }

    describe(integrationTestSuite.description, () => {
        for (const integrationTest of integrationTestSuite.tests) {
            registerBackgroundIntegrationTest(integrationTest)
        }
    })
}
