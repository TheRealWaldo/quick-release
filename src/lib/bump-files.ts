import { replaceInFile } from 'replace-in-file';
import { debug } from '@actions/core';

export async function bumpFiles(
  latestVersion: string,
  recommendedVersion: string,
  files: string[]
) {
  if (files && files.length) {
    debug(`Bumping version in ${files.length} files...`);
    return replaceInFile({
      files: files,
      from: new RegExp(latestVersion, 'g'),
      to: recommendedVersion,
    });
  } else {
    debug(`No files to bump.`);
    return {};
  }
}
