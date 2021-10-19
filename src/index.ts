import { info, error, debug, setFailed, warning, getInput, setOutput } from '@actions/core';
import dateFormat from 'dateformat';
import { loadConventionConfiguration } from './lib/convention-configuration';
import {
  createBranch,
  detectConvention,
  getCommitMessages,
  getLatestVersionFromTags,
  remoteBranchExists,
  setUpGit,
} from './lib/git-operations';
import { getRecommendedVersion } from './lib/get-recommended-version';
import { generateChangelog } from './lib/generate-changelog';
import { bumpFiles } from './lib/bump-files';
import simpleGit from 'simple-git';
import { default as debugLogger } from 'debug';
import { addAssignees, createOrUpdatePullRequest } from './lib/github-operations';

process.on('unhandledRejection', (rejectionError) => {
  if (rejectionError instanceof Error) {
    error(rejectionError.message);
  }
  setFailed('Unhandled rejection, please inform the developer!');
});

try {
  debugLogger.enable('simple-git,simple-git:*');
  const tagPrefix = getInput('tag-prefix');
  debug(`Using tag prefix: ${tagPrefix}`);
  const githubToken = getInput('github-token', { required: true });
  const githubUsername = getInput('github-username', { required: true });
  const gitUserName = getInput('git-user-name', { required: true });
  const gitUserEmail = getInput('git-user-email') || process.env.GITHUB_EMAIL;
  if (!gitUserEmail || !gitUserEmail.length) {
    throw Error('Could not determine git-user-email');
  }
  const ownerGithubUsername = getInput('owner-github-username');
  const replaceFiles = getInput('replace-files')
    .split(',')
    .map((filePath) => filePath.trim())
    .filter((filePath) => filePath !== '');
  const remoteActionRepo = `https://${encodeURIComponent(githubUsername)}:${encodeURIComponent(
    githubToken
  )}@github.com/${process.env.GITHUB_REPOSITORY}.git`;
  const remoteRepo = `https://github.com/${process.env.GITHUB_REPOSITORY}.git`;
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
  const convention = getInput('preset') || detectConvention();
  const commitMessages = getCommitMessages(latestVersion, 'HEAD');

  loadConventionConfiguration(convention)
    .then((config) => {
      const recommendedVersion = getRecommendedVersion(
        latestVersion,
        tagPrefix,
        commitMessages,
        config
      );

      if (recommendedVersion === latestVersion) {
        info('Nothing qualified to release.');
        // TODO: Create a feature to back-check/validate and update all past releases (addresses bug from release-it)
      } else {
        // TODO: Check if the last commit is a chore(release) bump (i.e. release PR has been merged)
        // TODO: Allow chore(release) commit to be configurable

        // TODO: Tag the release/do the github release
        const git = simpleGit();
        // TODO: Allow chore(release) commit to be configurable?
        const title = `chore(release): ${recommendedVersion}`;

        if (remoteBranchExists(remoteRepo, 'release')) {
          warning('Release branch already exists on the remote.');
          setFailed('Updating of existing releases not yet supported.');
          process.exit(1);
          // TODO: Rebase the existing release branch onto this head (probably master/main) and check it out
        } else {
          createBranch('release');
        }

        return Promise.all([
          bumpFiles(latestVersion, recommendedVersion, replaceFiles),
          generateChangelog(
            commitMessages,
            {
              version: recommendedVersion,
              repoUrl: remoteRepo,
              host: 'https://github.com',
              owner: ownerGithubUsername,
              issue: 'issues',
              commit: 'commit',
              date: dateFormat(new Date(), 'yyyy-mm-dd', true),
            },
            config
          ),
        ]).then(([replacementResults, changeLog]) => {
          // TODO: If there was nothing bumped, there is nothing to commit: if the branch already existed this might be okay, if not, we might have an error as there'll be nothing to commit, push, and possibly an empty pull-request.  Handle this situation.
          // TODO: Add a feature to run post bump file commands specified in action config (i.e. build/compile)
          debug(`Replacement results: ${JSON.stringify(replacementResults)}`);

          info('Changelog:');
          info(changeLog);

          debug('committing...');

          return git
            .add(replaceFiles)
            .commit([title, changeLog])
            .push('origin', 'release')
            .then(() => {
              const pullRequestPromise = createOrUpdatePullRequest(
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
                  addAssignees(owner, repo, issue_number, assignees)
                );
              }
              return pullRequestPromise;
            });
        });
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
