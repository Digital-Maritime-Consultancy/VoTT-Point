# VoTT-dot (Visual Object Tagging Tool)

[![Build Status](https://dev.azure.com/msft-vott/VoTT/_apis/build/status/VoTT/Microsoft.VoTT?branchName=master)](https://dev.azure.com/msft-vott/VoTT/_build/latest?definitionId=25&branchName=master)
[![Code Coverage](https://codecov.io/gh/Microsoft/VoTT/branch/master/graph/badge.svg)](https://codecov.io/gh/Microsoft/VoTT)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Microsoft_VoTT&metric=alert_status)](https://sonarcloud.io/dashboard?id=Microsoft_VoTT)

[Complexity Analysis Report](https://vottv2.z5.web.core.windows.net/)

----------

VoTT-dot is an open source annotation tool working with Stella system (for project management) and having additional features on top of VoTT:

* RemoteStorage for storing metadata and project file at a server (see [VoTT-dot-server for more information](https://github.com/Digital-Maritime-Consultancy/VoTT-dot-server))
* Configuration for Stella project management system
* Dot-based annotation powered by deep-learning-enabled server which returns a corresponding rectangle region

## Getting Started

VoTT-dot can be installed as a native application or run from source. VoTT is also available as a [stand-alone Web application](https://vott.z22.web.core.windows.net) and can be used in any modern Web browser.

### Download and install a release package for your platform (recommended)

VoTT-dot is available for Windows, Linux and OSX. Download the appropriate platform package/installer from [GitHub Releases](https://github.com/Microsoft/VoTT/releases). `v2` releases will be prefixed by `2.x`.

### Build and run from source

VoTT-dot requires [NodeJS (>= 10.x, Dubnium) and NPM](https://github.com/nodejs/Release)

   ```bash
    git clone https://github.com/Microsoft/VoTT.git
    cd VoTT
    npm ci
    npm start
   ```
   > **IMPORTANT**
   >
   > When running locally with `npm`, both the electron and the browser versions of the application will start. One major difference is that the electron version can access the local file system.

### Run as Web Application

Using a modern Web browser, VoTT can be loaded from: [https://vott.z22.web.core.windows.net](https://vott.z22.web.core.windows.net)

As noted above, the Web version of VoTT *cannot* access the local file system; all assets must be imported/exported through a Cloud project.
