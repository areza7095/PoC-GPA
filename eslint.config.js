const spfxProfile = require('@microsoft/eslint-config-spfx/lib/flat-profiles/react');

module.exports = [
  ...spfxProfile,
  {
    // Build outputs: never lint generated bundles (sharepoint/solution/debug/...).
    ignores: ['sharepoint/**', 'lib/**', 'dist/**', 'temp/**', 'teams/**']
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json'
      }
    }
  }
];
