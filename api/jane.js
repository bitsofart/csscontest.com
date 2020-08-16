require("dotenv").config();
const crypto = require("crypto");
const bot = require("janethebot");
const github_secret = process.env.GITHUB_SECRET;
const jane_secret = process.env.JANE_SECRET;

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

function checkAuth(authorizationHeader) {
  if (!authorizationHeader) {
    return false;
  }
  const token = authorizationHeader.split(/\s+/).pop();
  const [username, password] = new Buffer.from(token, "base64")
    .toString()
    .split(/:/);
  const { janeUser, janePassword } = JSON.parse(jane_secret);
  return username === janeUser && password === janePassword;
}

export default async (request, response) => {
  const {
    headers,
    body,
    query: { q },
  } = request;
  try {
    if (q && q === "select-issue") {
      if (checkAuth(headers["authorization"])) {
        await bot.janeHandles.issues.selectWinner();
        return response.json({ message: "Jane selected the winning issue." });
      }

      response.status(401);
      return response.json({
        message: "Unauthorized",
      });
    }
    if (q && q === "select-pr") {
      if (checkAuth(headers["authorization"])) {
        await bot.janeHandles.pullRequests.selectWinner();
        return response.json({ message: "Jane selected the winning PR." });
      }

      response.status(401);
      return response.json({
        message: "Unauthorized",
      });
    }
    if (!validateGithubSignature(body, headers["x-hub-signature"])) {
      response.status(401);
      return response.json({
        message: "Unauthorized",
      });
    }
    if (body.issue) {
      await bot.janeHandles.issues.verify(body.issue.number, body.action, body);
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
  } catch ({ message }) {
    response.status(500);
    return response.json({ message });
  }
};
