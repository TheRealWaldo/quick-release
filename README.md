# quick-release v0.2.0

Quick Release is a GitHub action that allows simple releases from a straightforward branching model leveraging a standard commit message convention and semantic versioning.

The intent is to encourage the practice of [Continuous Integration](https://en.wikipedia.org/wiki/Continuous_integration), [Continuous Delivery](https://en.wikipedia.org/wiki/Continuous_delivery), and [Continuous Deployment](https://en.wikipedia.org/wiki/Continuous_deployment) with GitHub by making it quick and easy to do so.

## Commit Message Convention

Quick Release uses [conventional-commits](https://www.conventionalcommits.org/), and libraries from [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog) to both generate changelogs and to determine the next semantic version.

Multiple presets are compiled-in and selectable from this actions configuration.

## Branching Model

Quick Release assumes you are leveraging Continuous Integration towards the `main` branch.  We believe developers should merge small pull requests there frequently.

Quick Release does not assume you want to release every single change immediately.  Instead, it creates a branch called `release` and a pull request pointing back to `main` with any updated files related to the deployment (i.e., files with version number bumped) within it.

## Usage

Start by adding the Quick Release GitHub Action to your repository actions.

### Example

```yaml
- name: Checkout
  uses: actions/checkout@v2
  with:
    fetch-depth: 0
    # The Checkout actions at v2 and beyond prevent pushes as another user because `persist-credentials` is now set to true by default.
    persist-credentials: false

- name: quick-release
  uses: TheRealWaldo/quick-release@v0.2.0
  with:
    token: ${{ secrets.PAT }}
    git-user-email: your@email.address
```

`secrets.PAT` should be replaced by an appropriate [Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) for the GitHub User you wish to commit on your behalf.  As a best practice, use [Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets) to store and access this PAT in your actions.

`your@email.address` should be replaced with your email address that you would like to use for any commits that Quick Release will do.  See [Setting your commit email address](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-user-account/managing-email-preferences/setting-your-commit-email-address).

### Inputs

|Input|Required?|Default|Description
|:---|---|---|----
|`token`|Yes|`${{ github.token }}`|GitHub Token to be used for creating pull requests, releases, etc.
|`git-user-email`|Yes||Set the git email address to use when quick-release commits.
|`git-user-name`|Yes|quick-release bump|Set the git users full name to use when quick-release commits.
|`github-username`|Yes|`${{ github.actor }}`|Set the Github username to use for creating/pushing updates.
|`tag-prefix`|No|v|Tag Prefix for versions.
|`base`|Yes|main|The base branch a release pull request should target.
|`preset`|No||Preset to use for conventional-recommended-bump.  If not specified will attempt to auto-detect.
|`replace-files`|No||Comma separated list of paths to files in which to replace the current version with the bumped version.
|`assignees`|No||Comma separated list of Github users to assign to pull-request.
|`publish-npm`|No|`false`|Run `npm publish` after performing GitHub release.

### Presets

The following presets are currently supported:
|Preset|Auto Detects?|Link
|:---|---|---
|`angular`|Yes|https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular
|`atom`|Yes|https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-atom
|`codemirror`|No|https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-codemirror
|`conventionalcommits`|No|https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-conventionalcommits
|`ember`|Yes|https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-ember
|`eslint`|Yes|https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-eslint
|`express`|No|https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-express
|`jquery`|Yes|https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-jquery
|`jshint`|Yes|https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-jshint

### Outputs
|Output|Description
|:---|---
|`recommendedVersion`|Proposed version based on commits.
|`latestVersion`|Previous or current version from tags.
|`changelog`|Changelog as generated from commits.
|`pull-request`|Pull request number if one was created or updated.
