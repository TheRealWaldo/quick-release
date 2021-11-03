import { info, error, debug, setFailed, getInput, setOutput } from '@actions/core';
import dateFormat from 'dateformat';
import { loadConventionConfiguration } from './lib/convention-configuration';
import {
  createBranch,
  detectConvention,
  getCommitMessages,
  getLatestVersionFromTags,
  setUpGit,
  getLatestCommitMessage,
} from './lib/git-operations';
import { getRecommendedVersion } from './lib/get-recommended-version';
import { generateChangelog } from './lib/generate-changelog';
import { bumpFiles } from './lib/bump-files';
import simpleGit from 'simple-git';
import { githubOperations } from './lib/github-operations';
import conventionalCommitsParser = require('conventional-commits-parser');
import { npmPublish } from './lib/npm-operations';

process.on('unhandledRejection', (rejectionError) => {
  if (rejectionError instanceof Error) {
    error(rejectionError.message);
  }
  setFailed('Unhandled rejection, please inform the developer!');
});

try {
  const tagPrefix = getInput('tag-prefix');
  debug(`Using tag prefix: ${tagPrefix}`);
  const githubToken = getInput('token', { required: true });
  const githubOp = new githubOperations({ auth: githubToken });
  const githubUsername = getInput('github-username', { required: true });
  const gitUserName = getInput('git-user-name', { required: true });
  const gitUserEmail = getInput('git-user-email') || process.env.GITHUB_EMAIL;
  if (!gitUserEmail || !gitUserEmail.length) {
    throw Error('Could not determine git-user-email.');
  }
  const publishNPM = getInput('npm-publish').toLowerCase() === 'true';
  const replaceFiles = getInput('replace-files')
    .split(',')
    .map((filePath) => filePath.trim())
    .filter((filePath) => filePath !== '');
  const remoteActionRepo = `https://${encodeURIComponent(githubUsername)}:${encodeURIComponent(
    githubToken
  )}@github.com/${process.env.GITHUB_REPOSITORY}.git`;
  const repoUrl = `https://github.com/${process.env.GITHUB_REPOSITORY}`;
  const base = getInput('base', { required: true });
  const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split('/');
  const assignees = getInput('assignees')
    .split(',')
    .map((assignee) => assignee.trim())
    .filter((assignee) => assignee !== '');
  if (!owner || !repo) {
    setFailed('GITHUB_REPOSITORY environment variable not present or incorrect.');
    process.exit(1);
  }
  debug(`owner: ${owner}`);
  debug(`repo: ${repo}`);

  // TODO: Replace?
  setUpGit(gitUserName, gitUserEmail, remoteActionRepo);

  const latestVersion = getLatestVersionFromTags(tagPrefix);
  setOutput('latestVersion', latestVersion);
  const convention = getInput('preset') || detectConvention();
  const commitMessages = getCommitMessages(
    latestVersion !== tagPrefix + '0.0.0' ? latestVersion : '',
    'HEAD'
  );

  loadConventionConfiguration(convention)
    .then((config) => {
      const recommendedVersion = getRecommendedVersion(
        latestVersion,
        tagPrefix,
        commitMessages,
        config
      );
      setOutput('recommendedVersion', recommendedVersion);

      if (recommendedVersion === latestVersion) {
        info('Nothing qualified to release.');
        // TODO: Create a feature to back-check/validate and update all past releases (addresses bug from release-it)
        return -1;
      } else {
        // TODO: Allow chore(release) commit to be configurable?
        const title = `chore(release): ${recommendedVersion}`;

        const latestCommit = conventionalCommitsParser.sync(getLatestCommitMessage());
        if (latestCommit.header === title) {
          info('Detected release PR merged.');
          return githubOp
            .release(
              owner,
              repo,
              recommendedVersion,
              `Release ${recommendedVersion}`,
              latestCommit.body || ''
            )
            .then(() => {
              if (publishNPM) {
                npmPublish();
              }
              return 0;
            });
        } else {
          const git = simpleGit();
          createBranch('release');

          return Promise.all([
            bumpFiles(latestVersion, recommendedVersion, replaceFiles),
            generateChangelog(
              commitMessages,
              {
                version: recommendedVersion,
                repoUrl: repoUrl,
                host: 'https://github.com',
                owner,
                issue: 'issues',
                commit: 'commit',
                date: dateFormat(new Date(), 'yyyy-mm-dd', true),
              },
              config
            ),
          ]).then(([replacementResults, changeLog]) => {
            // TODO: If there was nothing bumped, there is nothing to commit: if the branch already existed this might be okay, if not, we might have an error as there'll be nothing to commit, push, and possibly an empty pull-request.  Handle this situation.  Perhaps a draft github release?
            // TODO: Add a feature to run post bump file commands specified in action config (i.e. build/compile)
            debug(`Replacement results: ${JSON.stringify(replacementResults)}`);

            setOutput('changelog', changeLog);
            info('Changelog:');
            info(changeLog);

            debug('committing...');

            return git
              .add(replaceFiles)
              .commit([title, changeLog])
              .push('origin', 'release', { '--force': null })
              .then(() => {
                const pullRequestPromise = githubOp.createOrUpdatePullRequest(
                  owner,
                  repo,
                  'release',
                  base,
                  title,
                  changeLog
                );
                pullRequestPromise.then((number) => setOutput('pull-request', number));
                if (assignees && assignees.length) {
                  pullRequestPromise.then((issue_number) =>
                    githubOp.addAssignees(owner, repo, issue_number, assignees)
                  );
                }
                return pullRequestPromise;
              });
          });
        }
      }
    })
    .catch((reason) => {
      setFailed(reason);
    });
} catch (error) {
  if (error instanceof Error) {
    setFailed(error.message);
  } else {
    setFailed('Unknown reason');
  }
}
