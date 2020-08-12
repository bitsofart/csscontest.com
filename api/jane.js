require("dotenv").config();
const crypto = require("crypto");
const bot = require("janethebot");
// const jane = require("jane-the-bot");
const github_secret = process.env.GITHUB_SECRET;

function validateGithubSignature(body, githubSignature) {
  if (!githubSignature) {
    return false;
  }
  const hmac = crypto.createHmac("sha1", github_secret);
  const calculatedSignature = `sha1=${hmac
    .update(JSON.stringify(body))
    .digest("hex")}`;
  const ourSignBuffer = Buffer.from(calculatedSignature);
  const theirSignBuffer = Buffer.from(githubSignature);
  return crypto.timingSafeEqual(ourSignBuffer, theirSignBuffer);
}

export default async (request, response) => {
  const { headers, body } = request;
  if (validateGithubSignature(body, headers["x-hub-signature"])) {
    if (body.issue) {
      await bot.janeHandles.issues.verifyIssue(
        body.issue.number,
        body.action,
        body
      );
      return response.json({ message: "Jane will handle the issue." });
    }

    if (body.pull_request) {
      await bot.janeHandles.pullRequests.verifyAndDeploy(
        body.pull_request.number,
        body.action,
        body
      );
      return response.json({ message: "Jane will handle the pull request." });
    }
    return response.json({ message: "Jane is not interested." });
  }

  response.status(401);
  return response.json({
    message: "Unauthorized",
  });
};
