# VoTT-dot (Visual Object Tagging Tool - dot)

VoTT-dot is an open source annotation tool working with Stella system (for project management) and having additional features on top of VoTT:

* RemoteStorage for storing metadata and project file at a server (see [VoTT-dot-server for more information](https://github.com/Digital-Maritime-Consultancy/VoTT-dot-server))
* Configuration for Stella project management system
* Dot-based annotation powered by deep-learning-enabled server which returns a corresponding rectangle region
* Zoom in and out support in canvas

## Getting Started

VoTT-dot can be used in any modern Web browser or as a native application.

### Build and run from source

VoTT-dot requires [NodeJS (>= 10.x, Dubnium) and NPM](https://github.com/nodejs/Release)

   ```bash
    git clone https://github.com/Digital-Maritime-Consultancy/VoTT-dot.git
    cd VoTT
    npm ci
    npm start
   ```
   > **IMPORTANT**
   >
   > When running locally with `npm`, both the electron and the browser versions of the application will start. One major difference is that the electron version can access the local file system.

### Run as Web Application

As noted above, the Web version of VoTT *cannot* access the local file system; all assets must be imported/exported through a Cloud project.
