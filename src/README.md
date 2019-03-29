# ProvenDocs Source Code.
The ProvenDocs source code can be split into the front and back ends (*client* and *server*).
## Repository Structure
***Note** - This documentation is still a work in progress.*
``` bash
src/
├── README.md
├── client                                  # Contains all front end code.
│   ├── App.jsx
│   ├── bundles
│   ├── common                              # Contains commonly used logic.
│   │   ├── api.js
│   │   ├── authentication.js
│   │   ├── constants.js
│   │   ├── index.js
│   │   ├── landing_content.js
│   │   ├── log.js
│   │   ├── particles.js
│   │   └── util.js
│   ├── components                          # Contains all Components.
│   │   ├── Common                          # Contains commonly used Components.
│   │   │   ├── Error.jsx
│   │   │   ├── Error.scss
│   │   │   ├── Loading.jsx
│   │   │   ├── Loading.scss
│   │   │   └── index.js
│   │   ├── Dashboard                       # Contains Subcomponents for the Dashboard Page.
│   │   │   ├── CommentAndTags.jsx
│   │   │   ├── EmailProofButton.jsx
│   │   │   ├── NewFileUpload.jsx
│   │   │   ├── NewUpload.scss
│   │   │   ├── TabbedPanel.jsx
│   │   │   ├── TabbedPanel.scss
│   │   │   ├── Timeline.jsx
│   │   │   ├── Timeline.scss
│   │   │   ├── ViewFiles.jsx
│   │   │   ├── ViewFiles.scss
│   │   │   └── index.js
│   │   ├── ExcelPreview                    # Excel Preview and Subcomponents.
│   │   │   ├── ExcelPreview.jsx
│   │   │   ├── ExcelPreview.scss
│   │   │   └── react-datasheet.scss
│   │   ├── Footer                          # Footer and Subcomponents.
│   │   │   ├── Footer.jsx
│   │   │   └── Footer.scss
│   │   ├── Login                           # Login and related components.
│   │   │   ├── EmailLogin.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── LoginFailed.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   ├── ResetPasswordSuccess.jsx
│   │   │   └── index.js
│   │   ├── Navigation                      # Navigation components.
│   │   │   ├── SideNavBar.jsx
│   │   │   ├── SideNavBar.scss
│   │   │   ├── TopNavBar.jsx
│   │   │   └── TopNavBar.scss
│   │   ├── Pages                           # Pages or master components.
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Dashboard.scss
│   │   │   ├── HomePage.jsx
│   │   │   ├── HomePage.scss
│   │   │   ├── LoginPage.jsx
│   │   │   ├── LoginSignup.scss
│   │   │   ├── RegistrationPage.jsx
│   │   │   ├── SharedDocument.jsx
│   │   │   ├── SharedDocument.scss
│   │   │   ├── Status
│   │   │   └── index.js
│   │   ├── ProofDiagram                    # Proof Diagram and related components.
│   │   │   ├── ProofDiagram.jsx
│   │   │   ├── ProofDiagram.scss
│   │   │   ├── ProofDiagramMini.jsx
│   │   │   ├── ProofDiagramMini.scss
│   │   │   ├── ProofDialog.jsx
│   │   │   └── ProofDialog.scss
│   │   ├── Register                        # Registration and related components.
│   │   │   ├── EmailConfirmed.jsx
│   │   │   ├── EmailResend.jsx
│   │   │   ├── EmailResendSuccess.jsx
│   │   │   ├── EmailSignup.jsx
│   │   │   ├── EmailSignupSuccess.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── RegisterFailed.jsx
│   │   │   ├── RegisterSuccess.jsx
│   │   │   └── index.js
│   │   ├── ShareDialog                     # Share Dialog Component.
│   │   │   ├── ShareDialog.jsx
│   │   │   └── ShareDialog.scss
│   │   ├── ViewDocument                    # Large Document Preview Component
│   │   │   ├── ViewDocument.jsx
│   │   │   └── ViewDocument.scss
│   │   ├── ViewProof                       # Large Proof Preview Component.
│   │   │   ├── ViewProof.jsx
│   │   │   └── ViewProof.scss
│   │   └── index.js
│   ├── index.jsx
│   ├── routes                              # All React Routers.
│   │   ├── failedRoutes.jsx                # Routes to be used if service has failed.
│   │   └── routes.jsx                      # Routes to be used if service is up.
│   ├── style                               # Global Styles, Colors, Fonts and Icons.
│   │   ├── fonts
│   │   ├── global_colors.scss
│   │   ├── global_mixins.scss
│   │   ├── global_styles.scss
│   │   └── icons
│   │       ├── color
│   │       ├── index.js
│   │       ├── monochrome
│   │       └── pages
│   └── templates
│       ├── bundle.js
│       ├── bundle.js.map
│       ├── fonts
│       │   ├── fix-icon.svg
│       │   ├── fontawesome-webfont.eot
│       │   ├── fontawesome-webfont.svg
│       │   ├── fontawesome-webfont.ttf
│       │   ├── fontawesome-webfont.woff
│       │   ├── fontawesome-webfont.woff2
│       │   ├── github-icon.svg
│       │   ├── google-icon.svg
│       │   ├── log-in-icon.svg
│       │   └── microsoft-icon.svg
│       └── index.ejs
└── server                                  # All Back End Code.
    ├── common                              # Commonly used constants and method.
    │   └── constants.js
    ├── config                              # Configuration for third party libraries.
    │   └── sendgrid.js
    ├── helpers                             # Helper functions to use with routes.
    │   ├── archiveBuilder.js
    │   ├── archives                        # Folder to contain temporary Archives for download.
    │   │   └── README.md
    │   ├── authHelpers.js
    │   ├── certificateBuilder.js
    │   ├── certificates                    # Folder to contain temporary Certificates for download.
    │   │   └── README.md
    │   ├── emailHelpers.js
    │   ├── fileHelpers.js
    │   ├── mimetypeHelpers.js
    │   ├── mongoAPI.js
    │   ├── provendb-sdk                    # ProvenDB SDK - WORK IN PROGRESS
    │   │   ├── README.md
    │   │   ├── index.js
    │   │   └── proofs.js
    │   ├── sendgrid.js
    │   ├── uploads                         # Folder to contain temporary files for upload.
    │   │   └── README.md
    │   ├── userHelpers.js
    │   └── workers                         # Implemenation of Worker Threads.
    │       ├── certificate
    │       ├── compressWorker.js
    │       ├── createCertificateWorker.js
    │       ├── decompressWorker.js
    │       └── filePreviewWorker.js
    ├── index.js
    ├── modules                             # Wrapper functions for third party modules.
    │   ├── passport.js
    │   └── winston.config.js
    ├── pages                               # HTML pages for rendering in iFrames.
    │   ├── failedToGetFile.html
    │   ├── failedToGetProof.html
    │   └── failedToGetUser.html
    ├── routes                              # Breakdown of different routes in to categories.
    │   ├── authRoutes.js
    │   ├── fileRoutes.js
    │   ├── proofRoutes.js
    │   ├── shareRoutes.js
    │   ├── uploadRoutes.js
    │   └── utilRoutes.js
    ├── server.js                           # Actual server implementation.
    └── swagger.json
```

## API Documentation
***Note** - This documentation is still a work in progress.*

## Code Structure
***Note** - This documentation is still a work in progress.*
