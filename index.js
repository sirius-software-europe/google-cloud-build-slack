const { IncomingWebhook } = require('@slack/client');
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const webhook = new IncomingWebhook(SLACK_WEBHOOK_URL);

// subscribe is the main function called by Cloud Functions.
exports.subscribe = (pubSubEvent, context) => {
  const build = pubSubEvent.data
    ? JSON.parse(Buffer.from(pubSubEvent.data, 'base64').toString())
    : null;

  if (build == null) {
    return;
  }

  // Skip if the current status is not in the status list.
  // Add additional statues to list if you'd like:
  // QUEUED, WORKING, SUCCESS, FAILURE,
  // INTERNAL_ERROR, TIMEOUT, CANCELLED
  const status = ['SUCCESS', 'FAILURE', 'INTERNAL_ERROR', 'TIMEOUT'];
  if (status.indexOf(build.status) === -1) {
    return;
  }

  // Send message to Slack.
  const message = createSlackMessage(build);
  webhook.send(message);
};

// dockerImage returns the last part of the provided URL.
// For example, gcr.io/tidal-1529434400027/cast-highlight:latest => cast-highlight:latest
const dockerImage = (url) => {
  return url.split('/').slice(-1)[0].split(':')[0];
}

// createSlackMessage create a message from a build object.
const createSlackMessage = (build) => {
  let images = build.images.map(dockerImage).join(', ');
  let message = {
    text: `Build \`${images}\` ${build.status}`,
    mrkdwn: true,
    attachments: [
      {
        text: `\`${build.id}\``,
        actions: [
          {
            type: "button",
            text: "Build Log",
            url: build.logUrl,
          }
        ]
      }
    ],
  };
  return message;
}
