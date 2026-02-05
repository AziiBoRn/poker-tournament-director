module.exports = [
    {
        ignores: [
            "**/.pnp.cjs",
            "**/.pnp.loader.mjs",
            "**/.yarn/**",
            "node_modules/**",
            "dist/**"
        ]
    },

    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "commonjs"
        },
        rules: {
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
            "no-console": "off"
        }
    }
];
