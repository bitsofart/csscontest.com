require("dotenv").config();
const crypto = require("crypto");
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

export default (request, response) => {
  const { headers, body } = request;
  console.log("Github says...");
  console.log({ body });
  if (validateGithubSignature(body, headers["x-hub-signature"])) {
    if (body.issue) {
      // jane.verifyIssue(body.issue);
      return response.json({ message: "Jane will handle the issue." });
    }

    if (body.issue) {
      // jane.verifyIssue(body.pull_request);
      return response.json({ message: "Jane will handle the pull request." });
    }
    return response.json({ message: "Jane is not interested." });
  }

  response.status(401);
  return;
  response.json({
    message: "Unauthorized",
  });
};
