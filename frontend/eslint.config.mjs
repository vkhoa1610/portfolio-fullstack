import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
});

const eslintConfig = [
    ...compat.extends(
        "next/core-web-vitals",
        "next/typescript",
        "plugin:jsx-a11y/recommended",
        "prettier"
    ),
    {
        rules: {
            // React rules
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
            "react/display-name": "off",

            // TypeScript rules
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/no-explicit-any": "warn",

            // Accessibility rules (quan trọng cho enterprise)
            "jsx-a11y/anchor-is-valid": [
                "error",
                {
                    components: ["Link"],
                    specialLink: ["hrefLeft", "hrefRight"],
                    aspects: ["invalidHref", "preferButton"],
                },
            ],
            "jsx-a11y/click-events-have-key-events": "warn",
            "jsx-a11y/no-static-element-interactions": "warn",

            // General best practices
            "no-console": ["warn", { allow: ["warn", "error"] }],
            "prefer-const": "error",
            "no-var": "error",
        },
    },
    {
        ignores: [
            "node_modules/",
            ".next/",
            "out/",
            "public/",
            "scripts/",
            "*.config.js",
            "*.config.mjs",
            "*.config.ts",
            "jest.setup.js",
            "next-env.d.ts",
        ],
    },
];

export default eslintConfig;
