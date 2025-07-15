#!/usr/bin/env bun

import { Octokit } from "@octokit/rest";
import { config as loadDotenv } from "dotenv";
import sodium from "libsodium-wrappers";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { existsSync } from "node:fs";

const argv = yargs(hideBin(Bun.argv))
  .option("envFile", {
    alias: "e",
    type: "string",
    description: "Path to custom .env file (default: .env)",
    default: ".env",
  })
  .strict()
  .parseSync();

const envPath = argv.envFile;

function loadEnvFile(path: string) {
  if (!existsSync(path)) {
    console.error(`❌ Error: .env file "${path}" not found.`);
    process.exit(1);
  }
  loadDotenv({ path, quiet: true });
}

function getGitHubConfig() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
  const GITHUB_OWNER = process.env.GITHUB_OWNER!;
  const GITHUB_REPO = process.env.GITHUB_REPO!;

  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    console.error(
      "❌ Error: Missing required environment variables: GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO.",
    );
    process.exit(1);
  }

  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  return { octokit, owner: GITHUB_OWNER, repo: GITHUB_REPO };
}

function normalizeName(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9_]/g, "");
}

async function encryptSecret(
  secret: string,
  publicKey: string,
): Promise<string> {
  await sodium.ready;
  const binkey = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL);
  const binsec = sodium.from_string(secret);
  const encrypted = sodium.crypto_box_seal(binsec, binkey);
  return sodium.to_base64(encrypted, sodium.base64_variants.ORIGINAL);
}

async function setRepoSecret(
  octokit: Octokit,
  owner: string,
  repo: string,
  name: string,
  value: string,
) {
  const { data: keyData } = await octokit.actions.getRepoPublicKey({
    owner,
    repo,
  });
  const encrypted_value = await encryptSecret(value, keyData.key);

  await octokit.actions.createOrUpdateRepoSecret({
    owner,
    repo,
    secret_name: name,
    encrypted_value,
    key_id: keyData.key_id,
  });

  console.log(`✅ Repo Secret ${name} set`);
}

async function setRepoVariable(
  octokit: Octokit,
  owner: string,
  repo: string,
  name: string,
  value: string,
) {
  const headers = {
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Check if the variable exists
  let exists = false;
  try {
    await octokit.request(
      "GET /repos/{owner}/{repo}/actions/variables/{name}",
      {
        owner,
        repo,
        name,
        headers,
      },
    );
    exists = true;
  } catch (err: any) {
    if (err.status !== 404) throw err;
  }

  // Update or create based on existence
  if (exists) {
    await octokit.request(
      "PATCH /repos/{owner}/{repo}/actions/variables/{name}",
      {
        owner,
        repo,
        name,
        value,
        headers,
      },
    );
    console.log(`♻️  Repo Variable ${name} updated`);
  } else {
    await octokit.request("POST /repos/{owner}/{repo}/actions/variables", {
      owner,
      repo,
      name,
      value,
      headers,
    });
    console.log(`✅ Repo Variable ${name} created`);
  }
}

function parseEnvEntries() {
  return Object.entries(process.env).filter(([_, val]) => !!val);
}

function isValidEnvValue(key: string, value: unknown): value is string {
  if (!value || typeof value !== "string" || value.trim() === "") {
    console.warn(`⚠️  Skipped ${key} because its value is empty or undefined.`);
    return false;
  }
  return true;
}

async function main() {
  loadEnvFile(envPath);
  const { octokit, owner, repo } = getGitHubConfig();
  const entries = parseEnvEntries();

  let found = false;

  for (const [key, value] of entries) {
    if (!isValidEnvValue(key, value)) continue;

    if (key.startsWith("GH_SECRET_")) {
      const name = normalizeName(key.replace("GH_SECRET_", ""));
      await setRepoSecret(octokit, owner, repo, name, value);
      found = true;
    } else if (key.startsWith("GH_VAR_")) {
      const name = normalizeName(key.replace("GH_VAR_", ""));
      await setRepoVariable(octokit, owner, repo, name, value);
      found = true;
    }
  }

  if (!found) {
    console.log(`⚠️  No GH_SECRET_ or GH_VAR_ entries found in ${envPath}`);
  }
}

main().catch((err) => {
  console.error("❌ Error:", err.response?.data || err.message);
});
