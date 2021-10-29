# Git Service Adapter <!-- omit in toc -->

## Description <!-- omit in toc -->

**Git Service Adapter** is a configurable plug-and-play module that allows applications to leverage [GitHub](https://github.com/) as a remote configuration storage container. Essentially, **Git Service Adapter** functions as a wrapper around the [GitHub v3 API](https://docs.github.com/en/rest). It is intended as an intermediary tool for applications migrating towards true cloud-based remote configuration. Advantage of remote configuration are discussed elsewhere.

## Table of Contents <!-- omit in toc -->

- [Security Considerations](#security-considerations)
- [Installation](#installation)
- [Set-up](#set-up)
- [Basic Usage](#basic-usage)
- [Arguments](#arguments)
- [Methods](#methods)
  - [`ServiceAdapter.prototype.fetchConfigFile()`](#serviceadapterprototypefetchconfigfile)
    - [**Description**](#description)
    - [**Arguments**](#arguments-1)
    - [**Output**](#output)
  - [`ServiceAdapter.prototype.printConnection()`](#serviceadapterprototypeprintconnection)
    - [**Description**](#description-1)
    - [**Arguments**](#arguments-2)
    - [**Output**](#output-1)
- [Events](#events)
  - [`configUpdated`](#configupdated)
    - [**Description**](#description-2)
- [Contribute](#contribute)
- [Support](#support)

## Security Considerations

The intended use of this package is through a service or "bot" user account. It is recommended that this account not be connected to any third-party applications and, of course, that only private repositories be provisioned. A [Personal Access Token]('https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token') is required. The token must have read permissions for repositories, files, and--if you intend to access repositories stored within connected organizations--organizations. It is up to development teams to determine least-privilege principles and manage token-cycling.

> ***Note**: It is up to **you** to determine whether or not **Git Service Adapter** is an appropriate tool for your application. While utilization allows for the separation of environment configurations from your codebase (GOOD), GitHub repositories are not specifically designed with this use-case in mind. With appropriate precautions (such as, but not limited to, those described above), however, it provides a serviceable option to quickly get up-and-running with remote configurations. As a disclaimer, use at your own discretion.*

## Installation

**Git Service Adapter** can be installed using the package manager of your choosing. The example command below uses [yarn](https://yarnpkg.com/).

```
$ yarn add git-service-adapter
```

**Git Service Adapter** ships with both CommonJS and ES6 compatibility out-of-the-box.

## Set-up

While it accepts arguments for all other parameters (except `NODE_ENV`, which is only read internally through `process.env`), arguments can be omitted in favour of allowing **Git Service Adapter** to read its own configuration variables from `process.env` directly. It is up to you to balance verbosity with readability. The following variables are available:

```
GIT_SERVICE_ACCESS_TOKEN=<your_bot_account_access_token>
GIT_USERNAME=<your_bot_account_username>
GIT_ORG=<your_org>
GIT_REPO=<your_config_repo>
GIT_FILE=<your_remote_config_file_name>
NODE_ENV=<env>
```

In keeping with convention, please note that if `NODE_ENV` is not set to `'development'`, a production environment will be assumed in order to help prevent errors as well as to moderate logging behaviors securely.

## Basic Usage

1. Import or require in your application:

```javascript
import ServiceAdapter from 'git-service-adapter';
```

2. Instantiate class (please see [Arguments](#arguments) section to see which arguments are optional and their defaults):

```javascript
const adapter = new ServiceAdapter({
    token: process.env.GIT_SERVICE_ACCESS_TOKEN,
    username: process.env.GIT_USERNAME,
    fileName: process.env.GIT_FILE,
    organization: process.env.GIT_ORG,
    repository: process.env.GIT_REPO,
    pollInterval: 1000 * 60 * 5,
    mute: false,
    local: false,
    verbose: true,
});
```

3. Check connection to remote repository by calling `establishConnection()`:

```javascript
await adapter.establishConnection();
```

4. Extract emitter (optional: only required if a `pollInterval` is specified):

```javascript
const emitter = adapter.emitter;
```

5. Setup `configUpdated` event listener (optional: see #4):

```javascript
emitter.addListener('configUpdated', someFunction);
```

6. Request configs directly using `fetchConfigFile()` (useful for asynchronously awaiting result for first-time config load, or wherever a `pollInterval` is not specified):

```javascript
const initialConfig = await adapter.fetchConfigFile();
```

## Arguments

| Name            | Default                                | Description                                                                                                                                                                                                                                                                                    |
| --------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fileName?`     | `process.env.GIT_FILE`                 | The name of the configuration file in the remote repository. Argument is optional, however a value is required if one cannot be read from `process.env`.                                                                                                                                       |
| `local?`        | `false`                                | Indicates whether a file should be read from the local environment. A file named `local.json` must be included at the root of the project directory with the required environment variables stored inside. Make sure you `.gitignore` this file!                                               | `mute?` | `false` | Toggles all logs on and off. |
| `organization?` | `process.env.GIT_ORG`                  | The name of the organization storing the remote repository and configuration file. This argument is truly optional -- if not included, it is assumed that the configs are stored in a repository directly on the service account.                                                              |
| `pollInterval?` | `undefined`                            | An optional argument used to provide the interval at which **Git Service Adapter** should check the configuration repository. Argument should be provided in milliseconds. If no argument is provided, polling does not occur. If an argument is provided, polling is initiated automatically. |
| `repository?`   | `process.env.GIT_REPO`                 | The name of the remote repository. Argument is optional, however a value is required if one cannot be read from `process.env`.                                                                                                                                                                 |
| `token?`        | `process.env.GIT_SERVICE_ACCESS_TOKEN` | The [Personal Access Token]('https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token') of the service account. Argument is optional, however a value is required if one cannot be read from `process.env`.                             |
| `username?`     | `process.env.GIT_USERNAME`             | The name of the service account. Argument is optional, however a value is required if one cannot be read from `process.env`.                                                                                                                                                                   |
| `verbose?`      | `false`                                | Toggles whether or not retrieved configurations should be logged to console. This happens independently of `mute`. If `process.env.NODE_ENV` is not explicitly set to `'development'`, this argument will be ignored to prevent accidental secret leakage.                                     |

## Methods

### `ServiceAdapter.prototype.fetchConfigFile()`

#### **Description**

An asynchronous method used to manually retrieve configuration. Can be called even when `pollInterval` is set. Use this method to await retrieval of initial configurations upon app startup.

This method does not allows for arguments to be passed. If for some reason multiple repositories need to be accessed (i.e. a base configuration and then environmental configurations -- not at all recommended, but a possibility: in general it is best to keep a unified set of configurations per environment), you should use multiple `ServiceAdapter` instances, and handle responses accordingly in your application.

#### **Arguments**

None

#### **Output**

Response in JavaScript `Object` format

### `ServiceAdapter.prototype.printConnection()`

#### **Description**

A method used to log connection details. The following are outputted to console: `username`, `repository`, `organization`, `fileName`. Useful for debugging, or to log connection at app initialization. Ignores both `verbose` and `mute` flags, and is agnostic of production / development environments.

#### **Arguments**

None

#### **Output**

none

## Events

### `configUpdated`

#### **Description**

This event is emitted under the following conditions:

1. A configuration has been retrieved from a remote or from local `local.json` file.
2. Internal reconciling process finds a difference between the incoming configuration and the existing configuration in memory.

Listen to this event to respond to configuration changes within your application. See [Basic Usage](#basic-usage) for an example.

## Contribute

If you encounter an issues, please open an issue! If you'd like to contribute features or functionality, feel free to submit a pull request. Feature requests also accepted.

## Support

-   [Buy me a coffee](https://www.buymeacoffee.com/dannyibrahim)
-   [Read my writing](https://medium.com/@thedannyibrahim/)
