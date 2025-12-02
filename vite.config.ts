import { resolve } from 'path'
import fs from 'fs'
import { defineConfig, build, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import type { ManifestV3Export } from '@crxjs/vite-plugin'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(async ({ command, mode: viteMode }) => {
    const envDir = resolve(__dirname, 'private')
    const env = loadEnv(viteMode, envDir)

    // Main entry points
    const inputEntries = {
        background:
            process.env.MANIFEST_VERSION !== '2'
                ? './src/background-mv3.ts'
                : './src/background.ts',
        popup: './src/popup/index.tsx',
        options: './src/options/options.tsx',
    }

    const contentScripts = [
        {
            name: 'content_script',
            entry: './src/content-scripts/content_script/global_webpage.ts',
        },
        {
            name: 'content_script_pdfjs',
            entry: './src/content-scripts/content_script/global_pdfjs.ts',
        },
        {
            name: 'content_script_in_page_ui_injections',
            entry: './src/content-scripts/content_script/in-page-ui-injections.ts',
        },
        {
            name: 'content_script_ribbon',
            entry: './src/content-scripts/content_script/ribbon.ts',
        },
        {
            name: 'content_script_tooltip',
            entry: './src/content-scripts/content_script/tooltip.ts',
        },
        {
            name: 'content_script_sidebar',
            entry: './src/content-scripts/content_script/sidebar.ts',
        },
    ]

    const manifestVersion = process.env.MANIFEST_VERSION ?? '3'
    const isManifestV3 = manifestVersion !== '2'
    const manifestPath = isManifestV3
        ? './src/manifest-v3.json'
        : './src/manifest.json'

    const manifestModule = await import(manifestPath, {
        with: { type: 'json' },
    })
    const manifest: ManifestV3Export = manifestModule.default

    const manifestForCrx = JSON.parse(JSON.stringify(manifest))
    delete manifestForCrx.content_scripts

    const alias = {
        '@': resolve(__dirname, './src'),
        '@worldbrain/storex/ts': resolve(
            __dirname,
            './external/@worldbrain/storex/ts',
        ),
        '@worldbrain/storex-backend-dexie': resolve(
            __dirname,
            './external/@worldbrain/storex-backend-dexie',
        ),
        '@worldbrain/storex-backend-firestore': resolve(
            __dirname,
            './external/@worldbrain/storex-backend-firestore',
        ),
        '@worldbrain/storex-backend-typeorm': resolve(
            __dirname,
            './external/@worldbrain/storex-backend-typeorm',
        ),
        '@worldbrain/storex-backend-sql': resolve(
            __dirname,
            './external/@worldbrain/storex-backend-sql',
        ),
        '@worldbrain/storex-pattern-modules': resolve(
            __dirname,
            './external/@worldbrain/storex-pattern-modules',
        ),
        '@worldbrain/storex-middleware-change-watcher': resolve(
            __dirname,
            './external/@worldbrain/storex-middleware-change-watcher',
        ),
        '@worldbrain/storex-hub': resolve(
            __dirname,
            './external/@worldbrain/storex-hub',
        ),
        '@worldbrain/storex-hub-interfaces': resolve(
            __dirname,
            './external/@worldbrain/storex-hub-interfaces',
        ),
        '@worldbrain/memex-common': resolve(
            __dirname,
            './external/@worldbrain/memex-common',
        ),
        '@worldbrain/memex-stemmer': resolve(
            __dirname,
            './external/@worldbrain/memex-stemmer',
        ),
        '@worldbrain/storex-sync': resolve(
            __dirname,
            './external/@worldbrain/storex-sync',
        ),
        'user-logic': resolve(__dirname, './external/user-logic'),
        'ui-logic-core': resolve(
            __dirname,
            './external/ui-logic/packages/ui-logic-core',
        ),
        'ui-logic-react': resolve(
            __dirname,
            './external/ui-logic/packages/ui-logic-react',
        ),

        'simple-signalling': resolve(__dirname, './external/simple-signalling'),
    }

    const define = {
        global: 'globalThis',
        // Defined for backward compatibility with external code and old usages
        'process.env.FIREBASE_MEMEX_API_KEY': JSON.stringify(
            env.VITE_FIREBASE_MEMEX_API_KEY,
        ),
        'process.env.FIREBASE_MEMEX_AUTH_DOMAIN': JSON.stringify(
            env.VITE_FIREBASE_MEMEX_AUTH_DOMAIN,
        ),
        'process.env.FIREBASE_MEMEX_DATABSE_URL': JSON.stringify(
            env.VITE_FIREBASE_MEMEX_DATABSE_URL,
        ),
        'process.env.FIREBASE_MEMEX_PROJECT_ID': JSON.stringify(
            env.VITE_FIREBASE_MEMEX_PROJECT_ID,
        ),
        'process.env.REACT_APP_FIREBASE_PROJECT_ID': JSON.stringify(
            env.VITE_FIREBASE_MEMEX_PROJECT_ID,
        ),
        'process.env.NODE_ENV': JSON.stringify(viteMode),
        'process.env.FIREBASE_MEMEX_MESSAGING_SENDER_ID': JSON.stringify(
            env.VITE_FIREBASE_MEMEX_MESSAGING_SENDER_ID,
        ),
        'process.env.FIREBASE_MEMEX_APP_ID': JSON.stringify(
            env.VITE_FIREBASE_MEMEX_APP_ID,
        ),
        'process.env.FIREBASE_MEMEX_MEASUREMENT_ID': JSON.stringify(
            env.VITE_FIREBASE_MEMEX_MEASUREMENT_ID,
        ),
        'process.env.FIREBASE_MEMEX_STORAGE_BUCKET': JSON.stringify(
            env.VITE_FIREBASE_MEMEX_STORAGE_BUCKET,
        ),
        'process.env.COUNTLY_APP_KEY': JSON.stringify(env.VITE_COUNTLY_APP_KEY),
        'process.env.COUNTLY_SERVER_URL': JSON.stringify(
            env.VITE_COUNTLY_SERVER_URL,
        ),
        'process.env.DEV_ANALYTICS': JSON.stringify(env.VITE_DEV_ANALYTICS),
        'process.env.FCM_VAPID_KEY': JSON.stringify(env.VITE_FCM_VAPID_KEY),
        'process.env.SENTRY_DSN': JSON.stringify(
            env.VITE_SENTRY_DSN ??
                'https://205014a0f65e4160a29db2935250b47c@sentry.io/305612',
        ),

        // VITE_ prefixed keys for new code usage (sourced from VITE-prefixed env vars in .env)
        'import.meta.env.VITE_FIREBASE_MEMEX_API_KEY': JSON.stringify(
            env.VITE_FIREBASE_MEMEX_API_KEY,
        ),
        'import.meta.env.VITE_FIREBASE_MEMEX_AUTH_DOMAIN': JSON.stringify(
            env.VITE_FIREBASE_MEMEX_AUTH_DOMAIN,
        ),
        'import.meta.env.VITE_FIREBASE_MEMEX_DATABSE_URL': JSON.stringify(
            env.VITE_FIREBASE_MEMEX_DATABSE_URL,
        ),
        'import.meta.env.VITE_FIREBASE_MEMEX_PROJECT_ID': JSON.stringify(
            env.VITE_FIREBASE_MEMEX_PROJECT_ID,
        ),
        'import.meta.env.VITE_FIREBASE_MEMEX_MESSAGING_SENDER_ID':
            JSON.stringify(env.VITE_FIREBASE_MEMEX_MESSAGING_SENDER_ID),
        'import.meta.env.VITE_FIREBASE_MEMEX_APP_ID': JSON.stringify(
            env.VITE_FIREBASE_MEMEX_APP_ID,
        ),
        'import.meta.env.VITE_FIREBASE_MEMEX_MEASUREMENT_ID': JSON.stringify(
            env.VITE_FIREBASE_MEMEX_MEASUREMENT_ID,
        ),
        'import.meta.env.VITE_FIREBASE_MEMEX_STORAGE_BUCKET': JSON.stringify(
            env.VITE_FIREBASE_MEMEX_STORAGE_BUCKET,
        ),
        'import.meta.env.VITE_COUNTLY_APP_KEY': JSON.stringify(
            env.VITE_COUNTLY_APP_KEY,
        ),
        'import.meta.env.VITE_COUNTLY_SERVER_URL': JSON.stringify(
            env.VITE_COUNTLY_SERVER_URL,
        ),
        'import.meta.env.VITE_DEV_ANALYTICS': JSON.stringify(
            env.VITE_DEV_ANALYTICS,
        ),
        'import.meta.env.VITE_FCM_VAPID_KEY': JSON.stringify(
            env.VITE_FCM_VAPID_KEY,
        ),
    }

    const buildContentScriptsPlugin = () => ({
        name: 'build-content-scripts',
        async closeBundle() {
            console.log('Building content scripts in parallel...')
            // Re-load env vars to ensure they are fresh for the content scripts build
            const env = loadEnv(viteMode, envDir)
            const contentScriptsDefine = {
                ...define,
                // Re-define these to ensure they catch the re-loaded env values
                'process.env.FIREBASE_MEMEX_API_KEY': JSON.stringify(
                    env.VITE_FIREBASE_MEMEX_API_KEY,
                ),
                'process.env.FIREBASE_MEMEX_AUTH_DOMAIN': JSON.stringify(
                    env.VITE_FIREBASE_MEMEX_AUTH_DOMAIN,
                ),
                'process.env.FIREBASE_MEMEX_DATABSE_URL': JSON.stringify(
                    env.VITE_FIREBASE_MEMEX_DATABSE_URL,
                ),
                'process.env.FIREBASE_MEMEX_PROJECT_ID': JSON.stringify(
                    env.VITE_FIREBASE_MEMEX_PROJECT_ID,
                ),
                'process.env.REACT_APP_FIREBASE_PROJECT_ID': JSON.stringify(
                    env.VITE_FIREBASE_MEMEX_PROJECT_ID,
                ),
                'process.env.FIREBASE_MEMEX_MESSAGING_SENDER_ID':
                    JSON.stringify(env.VITE_FIREBASE_MEMEX_MESSAGING_SENDER_ID),
                'process.env.FIREBASE_MEMEX_APP_ID': JSON.stringify(
                    env.VITE_FIREBASE_MEMEX_APP_ID,
                ),
                'process.env.FIREBASE_MEMEX_MEASUREMENT_ID': JSON.stringify(
                    env.VITE_FIREBASE_MEMEX_MEASUREMENT_ID,
                ),
                'process.env.FIREBASE_MEMEX_STORAGE_BUCKET': JSON.stringify(
                    env.VITE_FIREBASE_MEMEX_STORAGE_BUCKET,
                ),
                'import.meta.env.VITE_FIREBASE_MEMEX_API_KEY': JSON.stringify(
                    env.VITE_FIREBASE_MEMEX_API_KEY,
                ),
                'import.meta.env.VITE_FIREBASE_MEMEX_AUTH_DOMAIN':
                    JSON.stringify(env.VITE_FIREBASE_MEMEX_AUTH_DOMAIN),
                'import.meta.env.VITE_FIREBASE_MEMEX_DATABSE_URL':
                    JSON.stringify(env.VITE_FIREBASE_MEMEX_DATABSE_URL),
                'import.meta.env.VITE_FIREBASE_MEMEX_PROJECT_ID':
                    JSON.stringify(env.VITE_FIREBASE_MEMEX_PROJECT_ID),
                'import.meta.env.VITE_FIREBASE_MEMEX_MESSAGING_SENDER_ID':
                    JSON.stringify(env.VITE_FIREBASE_MEMEX_MESSAGING_SENDER_ID),
                'import.meta.env.VITE_FIREBASE_MEMEX_APP_ID': JSON.stringify(
                    env.VITE_FIREBASE_MEMEX_APP_ID,
                ),
                'import.meta.env.VITE_FIREBASE_MEMEX_MEASUREMENT_ID':
                    JSON.stringify(env.VITE_FIREBASE_MEMEX_MEASUREMENT_ID),
                'import.meta.env.VITE_FIREBASE_MEMEX_STORAGE_BUCKET':
                    JSON.stringify(env.VITE_FIREBASE_MEMEX_STORAGE_BUCKET),
            }

            await Promise.all(
                contentScripts.map((script) => {
                    console.log(`Building ${script.name}...`)
                    return build({
                        configFile: false,
                        mode: viteMode,
                        define: contentScriptsDefine,
                        plugins: [
                            tsconfigPaths(),
                            react({ babel: { plugins: [] } }),
                        ],
                        resolve: { alias },
                        build: {
                            emptyOutDir: false,
                            outDir: 'extension',
                            lib: {
                                entry: script.entry,
                                name: script.name,
                                formats: ['iife'], // IIFE to fix syntax error
                                fileName: () => `${script.name}.js`,
                            },
                            rollupOptions: { output: { extend: true } },
                        },
                    })
                }),
            )
            console.log('Content scripts built.')

            const outManifestPath = resolve(
                __dirname,
                'extension/manifest.json',
            )
            if (fs.existsSync(outManifestPath)) {
                const outManifest = JSON.parse(
                    fs.readFileSync(outManifestPath, 'utf-8'),
                )
                const originalManifest = manifest as any
                if (originalManifest.content_scripts) {
                    const pathMap = {
                        './src/content-scripts/content_script/global_webpage.ts':
                            'content_script.js',
                        './src/content-scripts/content_script/global_pdfjs.ts':
                            'content_script_pdfjs.js',
                        './src/content-scripts/content_script/in-page-ui-injections.ts':
                            'content_script_in_page_ui_injections.js',
                        './src/content-scripts/content_script/ribbon.ts':
                            'content_script_ribbon.js',
                        './src/content-scripts/content_script/tooltip.ts':
                            'content_script_tooltip.js',
                        './src/content-scripts/content_script/sidebar.ts':
                            'content_script_sidebar.js',
                    }
                    outManifest.content_scripts =
                        originalManifest.content_scripts.map((cs: any) => {
                            const newJs = cs.js?.map(
                                (jsFile: string) => pathMap[jsFile] || jsFile,
                            )
                            return { ...cs, js: newJs }
                        })
                    fs.writeFileSync(
                        outManifestPath,
                        JSON.stringify(outManifest, null, 4),
                    )
                    console.log('Manifest patched with content scripts.')
                }
            }
        },
    })

    return {
        envDir: resolve(__dirname, 'private'),
        plugins: [
            tsconfigPaths(),
            react({ babel: { plugins: [] } }),
            crx({ manifest: manifestForCrx }),
            buildContentScriptsPlugin(),
        ],
        resolve: { alias },
        define,
        optimizeDeps: {
            include: [
                'firebase/app',
                'firebase/auth',
                'dexie',
                'dexie-mongoify',
                'page-metadata-parser',
                '@josephg/resolvable',
                'styled-components',
            ],
            exclude: ['pdfjs-dist'],
        },
        build: {
            target: 'es2022',
            sourcemap: true,
            cssCodeSplit: false,
            outDir: 'extension',
            emptyOutDir: true,
            rollupOptions: {
                input: inputEntries,
                output: {
                    entryFileNames: '[name].js',
                    chunkFileNames: 'assets/chunk-[hash].js',
                    assetFileNames: 'assets/[name].[hash].[ext]',
                },
                manualChunks: undefined,
            },
        },
        publicDir: 'public',
        server: {
            port: 3000,
            strictPort: true,
            hmr: { port: 24678 },
        },
    }
})
