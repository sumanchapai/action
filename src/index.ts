import { promises as fs } from 'fs'
import { arch, platform } from 'os'

import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as tc from '@actions/tool-cache'
import { SemVer } from 'semver'

function getPlatformArch (a: string, p: string): string {
  const platform = {
    win32: 'windows'
  }
  const arch = {
    x64: 'amd64',
    x32: '386'
  }
  return (platform[p] ? platform[p] : p) + '/' + (arch[a] ? arch[a] : a)
}

async function installLatestSemRelVersion (): Promise<string> {
  core.info('downloading semantic-release binary...')
  const path = await tc.downloadTool(`https://registry.go-semantic-release.xyz/downloads/${getPlatformArch(arch(), platform())}/semantic-release`)
  await fs.chmod(path, '0755')
  return path
}

async function runSemanticReleaseGo (binPath: string, dry: boolean): Promise<number> {
  const args = ['--version-file', 'hooks', 'goreleaser']
  if (dry) {
    args.push('--dry')
  }
  if (core.getInput('github-token')) {
    args.push('--token')
    args.push(core.getInput('github-token'))
  }
  return await exec.exec(binPath, args)
}

const dryVersionFileName = '.version-unreleased'
const releasedVersionFileName = '.version'

async function main (): Promise<void> {
  try {
    // First of all we run the semantic release in dry mode
    // to get the proposed version number
    // Binary path for semantic-release
    const binPath = await installLatestSemRelVersion()
    const statusCode = await runSemanticReleaseGo(binPath, true)
    // exit if no new version to release or if got any other error
    if (statusCode !== 0) {
      return
    }

    // Setup git
    // TODO, read from context
    // const gitUserEmail = (core.getInput('gitUserEmail')) || 'bot'
    // const gitUserName = (core.getInput('gitUserName')) || 'bot@example.com'
    const gitUserEmail = 'bot'
    const gitUserName = 'bot@example.com'
    fs.rename(dryVersionFileName, releasedVersionFileName)
    const version = (await fs.readFile(releasedVersionFileName)).toString('utf8')
    const parsedVersion = new SemVer(version)

    // Setup git user name and email
    await exec.exec('git', ['config', 'user.email', gitUserEmail])
    await exec.exec('git', ['config', 'user.name', gitUserName])

    // Push to git
    core.info(`pushing ${releasedVersionFileName} file to git`)
    await exec.exec('git', ['add', releasedVersionFileName])
    await exec.exec('git', ['commit', '-m', 'release: update version'])
    // We expect this git push to not trigger another action
    // otherwise, actions will be created recursively
    await exec.exec('git', ['push'])

    // Now we create a release, we set dry mode to false
    await runSemanticReleaseGo(binPath, false)

    core.debug(`setting version to ${parsedVersion.version}`)
    core.setOutput('version', parsedVersion.version)
    core.setOutput('version_major', `${parsedVersion.major}`)
    core.setOutput('version_minor', `${parsedVersion.minor}`)
    core.setOutput('version_patch', `${parsedVersion.patch}`)
    core.setOutput('version_prerelease', parsedVersion.prerelease.join('.'))
  } catch (error) {
    core.setFailed(error.message)
  }
}

main()
