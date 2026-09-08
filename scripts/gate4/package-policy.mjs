export const expectedPackagePaths = Object.freeze({
  core: Object.freeze([
    'dist/components.css',
    'dist/fonts/IBMPlexMono-Medium.woff2',
    'dist/fonts/IBMPlexMono-Regular.woff2',
    'dist/fonts/IBMPlexSans-Italic.woff2',
    'dist/fonts/IBMPlexSans-Medium.woff2',
    'dist/fonts/IBMPlexSans-Regular.woff2',
    'dist/fonts/IBMPlexSans-SemiBold.woff2',
    'dist/fonts/IBMPlexSerif-Italic.woff2',
    'dist/fonts/IBMPlexSerif-Regular.woff2',
    'dist/fonts/lamplight-fonts.css',
    'dist/fonts/OFL.txt',
    'dist/lamplight.css',
    'dist/lamplight.tokens.json',
    'dist/living-light.d.ts',
    'dist/living-light.js',
    'dist/tokens.css',
    'package.json',
  ]),
  react: Object.freeze([
    'dist/index.d.ts',
    'dist/index.js',
    'package.json',
  ]),
});

export function validatePackageFileList(label, actualPaths, expectedPaths) {
  const actual = [...actualPaths];
  const expected = [...expectedPaths];
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const duplicates = actual.filter((path, index) => actual.indexOf(path) !== index);
  const missing = expected.filter((path) => !actualSet.has(path));
  const extra = actual.filter((path) => !expectedSet.has(path));

  if (duplicates.length || missing.length || extra.length) {
    const details = [
      duplicates.length ? `duplicates: ${[...new Set(duplicates)].join(', ')}` : null,
      missing.length ? `missing: ${missing.join(', ')}` : null,
      extra.length ? `extra: ${extra.join(', ')}` : null,
    ].filter(Boolean).join('; ');
    throw new Error(`${label} tarball path allowlist mismatch (${details})`);
  }

  return { expected: expected.length, actual: actual.length };
}
