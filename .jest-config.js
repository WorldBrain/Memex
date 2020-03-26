const { jsWithTs: tsjPreset } = require('ts-jest/presets')
const externalTsModules = require('./build/external').externalTsModules

const externalTsModuleMappings = {}
for (const externalTsModule of externalTsModules) {
    Object.assign(externalTsModuleMappings, {
        [`^${externalTsModule}$`]: `<rootDir>/external/${externalTsModule}/ts`,
        [`^${externalTsModule}/lib/(.*)`]: `<rootDir>/external/${externalTsModule}/ts/$1`,
    })
}

module.exports = {
    globals: {
        'ts-jest': {
            tsConfig: 'tsconfig.jest.json',
            babelConfig: true,
        },
        browser: {},
    },
    testMatch: ['<rootDir>/src/**/*.test.(js|jsx|ts|tsx)'],
    rootDir: '.',
    transform: {
        ...tsjPreset.transform,
    },
    modulePaths: ['<rootDir>'],
    moduleNameMapper: {
        '\\.(css|less)$': 'identity-obj-proxy',
        ...externalTsModuleMappings,
    },
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
    setupFiles: ['jest-webextension-mock', './setupJest.js'],
    unmockedModulePathPatterns: [
        '<rootDir>/node_modules/react',
        '<rootDir>/node_modules/react-dom',
        '<rootDir>/node_modules/react-addons-test-utils',
        '<rootDir>/node_modules/fbjs',
    ],
}
