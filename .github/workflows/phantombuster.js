const axios = require('axios');
const fs = require('fs');
const AWS = require('aws-sdk');

const { apiKey, agentId, accessKeyId, secretAccessKey } = JSON.parse(process.env.SECRET);
const bucketName = process.env.BUCKET_NAME;

async function run() {
  const launchRes = await axios.post(
    'https://api.phantombuster.com/api/v2/agents/launch',
    { id: agentId },
    { headers: { 'X-Phantombuster-Key-1': apiKey } }
  );
  const containerId = launchRes.data.containerId;
  console.log("🚀 Launched agent with container ID:", containerId);

  await new Promise(r => setTimeout(r, 20000));

  const resultRes = await axios.get(
    `https://api.phantombuster.com/api/v2/containers/fetch-output?id=${containerId}`,
    { headers: { 'X-Phantombuster-Key-1': apiKey } }
  );
  const output = JSON.stringify(resultRes.data, null, 2);
  fs.writeFileSync("phantom_output.json", output);
  console.log("✅ Output saved locally: phantom_output.json");

  const s3 = new AWS.S3({ accessKeyId, secretAccessKey });
  await s3.upload({
    Bucket: bucketName,
    Key: `phantom-data/phantom_output_${Date.now()}.json`,
    Body: output,
    ContentType: "application/json"
  }).promise();
  console.log("✅ Uploaded to S3");
}

run().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
