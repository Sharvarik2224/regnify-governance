import { exec } from "child_process";
import crypto from "crypto";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);
const DEFAULT_P12_PASSWORD = process.env.CERT_PASSWORD || "123456";

const sanitize = (value) => String(value || "").replace(/[^a-zA-Z0-9@._-]/g, "_");
const quoteArg = (value) => `"${String(value).replace(/"/g, '\\"')}"`;

export const generateCertificate = async (name, email, company) => {
  const safeName = sanitize(name || "HR");
  const safeEmail = sanitize(email || "unknown@example.com");
  const safeCompany = sanitize(company || "Regnify");

  const folder = path.join(
    os.tmpdir(),
    "regnify-certificates",
    `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
  );

  await fs.mkdir(folder, { recursive: true });

  const key = path.join(folder, "private.key");
  const csr = path.join(folder, "request.csr");
  const crt = path.join(folder, "certificate.crt");
  const p12 = path.join(folder, "certificate.p12");

  const subject = `/C=IN/ST=Maharashtra/L=Mumbai/O=${safeCompany}/OU=${safeName}/CN=${safeEmail}`;

  // 1) Generate private key
  await execAsync(`openssl genrsa -out ${quoteArg(key)} 2048`);

  // 2) Generate CSR
  await execAsync(
    `openssl req -new -key ${quoteArg(key)} -out ${quoteArg(csr)} -subj ${quoteArg(subject)}`,
  );

  // 3) Self-sign certificate
  await execAsync(
    `openssl x509 -req -days 365 -in ${quoteArg(csr)} -signkey ${quoteArg(key)} -out ${quoteArg(crt)}`,
  );

  // 4) Generate P12 bundle
  await execAsync(
    `openssl pkcs12 -export -out ${quoteArg(p12)} -inkey ${quoteArg(key)} -in ${quoteArg(crt)} -password pass:${quoteArg(DEFAULT_P12_PASSWORD)}`,
  );

  return {
    filePath: p12,
    cleanupPath: folder,
  };
};

export const cleanupGeneratedCertificate = async (cleanupPath) => {
  if (!cleanupPath) {
    return;
  }

  await fs.rm(cleanupPath, { recursive: true, force: true });
};
