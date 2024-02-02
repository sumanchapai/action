**This is a highly specialized fork from [go-semantic-release/action](https://github.com/go-semantic-release/action/). Use the original version for specific needs.**

This fork address the the problem of updating the version number before creating a build so the new release has the new release version. This is useful when you create something like a `version` subcommand for your cli or something like that (recall `git version`). When a new release is created, the version has to be incremented and only then the release has to be created so that the `cli` has access the the updated version number. This actions takes the following steps:

1. Create a dry release and check if new release would be created. 
1. Exit if no new release is to be created.
1. If new release is to be created, create `.version` file. Add/Commit/Push changes to the git.
1. Create an actual release.


This action runs the `goreleaser` hook by default. There's not much customization you can do using this hook. Something that you might needs is to run custom command between the dry-release and the actual release. You can do so by passing the input to the key `pre-release-post-dry-cmd`. Also, see the example CI below and check `action.yml` for the inputs and outputs.



## Example workflow
`./github/workflow/ci.yml`
```
name: CI
on:
  push:
    branches:
      - '**'
  pull_request:
    branches:
      - '**'
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v4
        with:
          go-version: '1.21'
      - uses: golangci/golangci-lint-action@v3
        with:
          args: --timeout=5m
  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v3
        with:
          go-version: 1.21
      - run: go test -v ./...
  release:
    runs-on: ubuntu-latest
    needs: test
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v3
        with:
          go-version: 1.21
      - uses: sumanchapai/go-semantic-release-action@V1
        with:
          pre-release-post-dry-cmd: "go generate ./..."
          files-to-commit: "cmd/.version"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
