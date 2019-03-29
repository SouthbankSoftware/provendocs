# Environment Variables
## Required for Running Locally without Authentication
```bash
export PROVENDOCS_URI="mongodb://${yourUserName}:${yourPassword}@${yourProvenDocsURL}/${YourProvenDocsDBName}"  # The ProvenDB Service URL to run against, or a local version of the ProvenDB Service.
```

## Required for Authentication
```bash
export PROVENDOCS_SECRET="${YOUR_AUTHENTICATION_SECRET_HERE}"    # Secret used for trust of API Gateway.
export USER_MODULE_URL="localhost:8000"                          # URL of User Module.
export API_URL="localhost:8080"                                  # URL of API Gateway.
export INTERNAL_API_URL="localhost:8080"                         # Internal API location.
export THUMBS_MODULE_URL="localhost:8889"                        # URL of Thumbs Service
```

## Required for Development
```bash
export PROVENDOCS_ENV="DEV"                                   # Can be TEST|DEV|PROD
export PROVENDOCS_URL="localhost:3000"                        # Required to run 'yarn dev'.
export PROVENDOCS_LOG_LEVEL="info"                            # Can be debug|info|error.
export PROVENDOCS_LOG_TYPE="prod"                             # Can be dev|prod, determines how logs are written.
export PROVENDOCS_PROOF_DEBOUNCE=300000                       # How often proofs will be submitted for documents.
export PROVENDOCS_PORT=8888                                   # The port for the Provendocs server to run on.
```

## Required for SendGrid Email Integration
```bash
export PROVENDOCS_SG_API_KEY="${YOUR_SENGRID_API_KEY_HERE}"   # API Key for Sendgrid.
```