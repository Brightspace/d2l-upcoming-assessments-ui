# \<d2l-upcoming-assessments\>

A Polymer widget to display upcoming assessments

## Install the Polymer-CLI

First, make sure you have the [Polymer CLI](https://www.npmjs.com/package/polymer-cli) installed. Then run `polymer serve` to serve your application locally.

## Viewing Your Application

```
$ polymer serve
```

## Building Your Application

```
$ npm run test
```

## Running Tests

```
$ polymer test
```

Your application is already set up to be tested via [web-component-tester](https://github.com/Polymer/web-component-tester). Run `polymer test` to run your application's test suite locally.

## Updating Translations

Translations are updated asynchronously using the `Serge-Localize` process. When a pull request updating language resource (JSON) files is merged, you must do the following:

1. Run `npm run build` to create new distribution files using the updated language resources.
2. Commit the files updated by the build process and create a new pull request.
3. Perform version bumps/releases of this and dependent packages as normal.
