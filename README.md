This is a highly specialized fork from [go-semantic-release/action](https://github.com/go-semantic-release/action/). 

<!-- There were a couple features that were lacking for my personal use thus I created a fork. Namely, when a release is created, I needed the new version name to be written somewhere so that  I could easily implement a version command in the command line appliation that I am writing (or even a go package).   This is possible in the [semantic-release](https://github.com/go-semantic-release/semantic-release/) in that it has an option to write `.version` dotfile but for some reason, the aforementioned action deletes that file. https://github.com/go-semantic-release/action/issues/32. -->



See my example workflow\
./github/workflow/ci.yml
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
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v3
        with:
          go-version: 1.21
      - uses: golangci/golangci-lint-action@v3
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
      - uses: sumanchapai/go-semantic-release-action@0a66b54b093b23b711439a7daa38f92c4406ab0d
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
