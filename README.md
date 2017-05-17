# slack-deploy-bot
I found that I spent a lot of time checking if my commits had been deployed to certain environments. So this is a simple slack bot that will, when asked, send you a message to let you know when a commit has been deployed.

It exposes and endpoint that you can curl as a step in your deployment once it is complete e.g.

    curl \
        -H "Content-Type: application/json" \
        -X POST \
        -d '{"environment": "ci", "commitHash": "347198c95b0c97f44418626872fbc7c95990031b"}' \
        -u user:password \
        localhost:8080 \


And if you have asked to be reminded about a commit that is before the one is deployed it will send you a message.

## Configuration
`slack-deploy-bot` uses [nconf](https://www.npmjs.com/package/nconf) for configuration, so therefore can be configured using (in order of precedence) :
1. command line arguments
2. environment variables
3. configuration file config.json in working directory

In order for it to run you need to specify the following:
- `slackToken`:  Your slack api key
- `environments`: A comma separated list of your environments
- `git:repoUrl`: the remote url of your git repository (currently only tested with local file and https urls)

There are also the following optional options:
- `git:userName`
- `git:password`
- `git:repoDir`: where you want `deploybot` to checkout the repository to
    - if this directory already contains the correct repo it will not re-clone
- `port`: the port number you wish the web service to use
- `logFolder`: where you wish the logs to be stored
- `storePath`: where the database file is stored

Optionally you can also setup basic authentication for the deployment notification endpoint using the following options (both must be specified)
- `apiUserName`: username used to secure the deploy notification endpoint
- `apiPassword`: password used to secure the deploy notification endpoint

## Quick start
    npm install slack-deploy-bot -g
    mkdir ~/deploybot
    cd ~/deploybot
    slack-deploy-bot --slackToken {yourslacktoken} --environments "ci, qa, live" --git:repoUrl "https://github.com/Rob-H/deploybot.git"
