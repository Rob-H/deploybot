#deploybot
I found that I spent a lot of time checking if my commits had been deployed to certain environments. So this is a simple slack bot that will, when asked, send you a message to let you know when a commit has been deployed. 

It exposes and endpoint that you can curl as a step in your deployment once it is complete e.g.
    curl example goes here
And if you have asked to be reminded about a commit that is before the one is deployed it will send you a message.

###Todo: add api key for validating deployments, ssl etc

##Configuration
`deploybot` uses [nconf](https://www.npmjs.com/package/nconf) for configuration, so therefore can be configured using (in order of precedence) :
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

##Quick start
    npm install deploybot -g
    mkdir ~/deploybot
    deploybot --slackToken {yourslacktoken} --environments "ci, qa, live" --git:repoUrl "https://github.com/Rob-H/deploybot.git"
