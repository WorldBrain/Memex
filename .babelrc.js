const stage0Plugins = ['@babel/plugin-proposal-function-bind']

const stage1Plugins = [
    '@babel/plugin-proposal-export-default-from',
    '@babel/plugin-proposal-logical-assignment-operators',
    ['@babel/plugin-proposal-optional-chaining', { loose: false }],
    ['@babel/plugin-proposal-pipeline-operator', { proposal: 'minimal' }],
    ['@babel/plugin-proposal-nullish-coalescing-operator', { loose: false }],
    '@babel/plugin-proposal-do-expressions',
]

module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                corejs: 3,
                useBuiltIns: 'entry',
                targets: {
                    browsers: [
                        'last 10 Firefox versions',
                        'last 10 Chrome versions',
                    ],
                },
            },
        ],
        '@babel/preset-react',
    ],
    plugins: [...stage0Plugins, ...stage1Plugins],
}
