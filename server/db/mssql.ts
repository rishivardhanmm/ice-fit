import "dotenv/config";

let poolPromise: Promise<any> | undefined;

export function shouldUseMssql(): boolean {
  return (process.env.DB_TYPE ?? "mssql").toLowerCase() === "mssql" && process.env.DB_DISABLED !== "true";
}

export async function getPool(): Promise<any> {
  if (!shouldUseMssql()) {
    throw new Error("MSSQL is disabled for this process.");
  }

  if (!poolPromise) {
    poolPromise = createPool();
  }

  return poolPromise;
}

async function createPool(): Promise<any> {
  // The msnodesqlv8 subpath is required for Windows Authentication.
  const sqlModule = await import("mssql/msnodesqlv8");
  const sql = (sqlModule as any).default ?? sqlModule;
  const trustServerCertificate = envBool("DB_TRUST_SERVER_CERTIFICATE", true);
  const encrypt = envBool("DB_ENCRYPT", false);
  const trustedConnection = envBool("DB_TRUSTED_CONNECTION", true);
  const server = process.env.DB_SERVER ?? "localhost";
  const database = process.env.DB_NAME ?? "ice_training_dev";
  const odbcDriver = process.env.DB_ODBC_DRIVER ?? "ODBC Driver 18 for SQL Server";
  const connectionString = [
    `Driver={${odbcDriver}}`,
    `Server=${server}`,
    `Database=${database}`,
    `Trusted_Connection=${trustedConnection ? "Yes" : "No"}`,
    `Encrypt=${encrypt ? "Yes" : "No"}`,
    `TrustServerCertificate=${trustServerCertificate ? "Yes" : "No"}`
  ].join(";");

  const config = {
    driver: "msnodesqlv8",
    connectionString
  };

  const pool = await new sql.ConnectionPool(config).connect();
  return pool;
}

function envBool(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
}
