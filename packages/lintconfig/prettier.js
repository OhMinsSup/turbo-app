/**
 * Some of Prettier's defaults can be overridden by an EditorConfig file. We
 * define those here to ensure that doesn't happen.
 *
 * See: https://github.com/prettier/prettier/blob/main/docs/configuration.md#editorconfig
 * @type {import('prettier').Config}
 */
const overridableDefaults = {
  endOfLine: 'lf',
  tabWidth: 2,
  printWidth: 80,
  useTabs: false,
};

/** @type {import('prettier').Config} */
const config = Object.assign({}, overridableDefaults, {
  semi: true,
  singleQuote: true,
  htmlWhitespaceSensitivity: 'ignore',
  trailingComma: 'all',
  plugins: ['prettier-plugin-packagejson', 'prettier-plugin-prisma'],
});

module.exports = config;
