#!/usr/bin/env bun

import { Octokit } from "@octokit/rest";
import { config } from "dotenv";
import sodium from "libsodium-wrappers";

config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_OWNER = process.env.GITHUB_OWNER!;
const GITHUB_REPO = process.env.GITHUB_REPO!;

const octokit = new Octokit({ auth: GITHUB_TOKEN });

function normalizeName(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9_]/g, "");
}

async function encryptSecret(secret: string, key: string): Promise<string> {
  await sodium.ready;
  const binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);
  const binsec = sodium.from_string(secret);
  const encryptedBytes = sodium.crypto_box_seal(binsec, binkey);
  return sodium.to_base64(encryptedBytes, sodium.base64_variants.ORIGINAL);
}

async function setRepoSecret(name: string, value: string) {
  const { data: keyData } = await octokit.actions.getRepoPublicKey({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
  });

  const encrypted_value = await encryptSecret(value, keyData.key);

  await octokit.actions.createOrUpdateRepoSecret({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    secret_name: name,
    encrypted_value,
    key_id: keyData.key_id,
  });

  console.log(`✅ Repo Secret ${name} set`);
}

async function setRepoVariable(name: string, value: string) {
  await octokit.request("POST /repos/{owner}/{repo}/actions/variables", {
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    name,
    value,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  console.log(`✅ Repo Variable ${name} set`);
}

async function main() {
  const entries = Object.entries(process.env);

  let found = false;

  for (const [key, value] of entries) {
    if (!value) continue;

    if (key.startsWith("GH_SECRET_")) {
      const name = normalizeName(key.replace("GH_SECRET_", ""));
      await setRepoSecret(name, value);
      found = true;
    } else if (key.startsWith("GH_VAR_")) {
      const name = normalizeName(key.replace("GH_VAR_", ""));
      await setRepoVariable(name, value);
      found = true;
    }
  }

  if (!found) {
    console.log("⚠️  No GH_SECRET_ or GH_VAR_ entries found in .env.");
  }
}

main().catch((err) => {
  console.error("❌ Error:", err.response?.data || err.message);
});
