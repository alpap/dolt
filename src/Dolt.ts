import type { Connection, ResultSetHeader } from "mysql2/promise";

export class Dolt {
  private conn: Connection;
  constructor(mysqlConnection: Connection) {
    this.conn = mysqlConnection;
  }

  private async query(sql: string) {
    const [rows] = await this.conn.query(sql);
    console.log(rows);
    return rows;
  }

  private flag(
    sql: string,
    options: [
      string | boolean | number | undefined,
      string,
      string | undefined
    ][]
  ) {
    let text = "CAll " + sql + "(";
    for (const option of options) {
      if (option[0]) {
        text += option[1] + ",";
      } else if (option[2]) {
        text += option[2] + ",";
      }
    }
    text = text.substring(0, text.length - 1);
    text += ");";
    return text;
  }

  /**
   * Creates a database
   *
   * @param {string} dbName
   * @return {*}  {Promise<boolean>}
   * @memberof Dolt
   */
  async CreateDatabase(dbName: string): Promise<boolean> {
    const sql = `CREATE DATABASE IF NOT EXISTS ${dbName};`;
    const res = (await this.query(sql)) as ResultSetHeader;
    return res.affectedRows > 0;
  }

  /**
   * Drops a database
   *
   * @param {string} dbName
   * @return {*}  {Promise<boolean>}
   * @memberof Dolt
   */
  async DropDatabase(dbName: string): Promise<boolean> {
    const sql = `DROP DATABASE IF EXISTS ${dbName};`;
    const res = (await this.query(sql)) as ResultSetHeader;
    return res.affectedRows > 0;
  }

  /**
   * Lists the databases
   *
   * @return {*}  {Promise<String[]>}
   * @memberof Dolt
   */
  async ListDatabases(): Promise<String[]> {
    const sql = `SHOW DATABASES;`;
    const res = (await this.query(sql)) as { Database: string }[];
    return res.map((db) => db.Database);
  }

  /**
   * Clones a database
   *
   * @param {string} from The database to clone if file is chosen 'file:///myDatabasesDir/database/.dolt/noms' .dolt/noms must be included
   * @param {string} to A cutom database name
   * @return {*}  {Promise<boolean>}
   * @memberof Dolt
   */
  async CloneDatabase(options: {
    from: string;
    branch?: string;
    remote?: string;
    depth?: number;
    to?: string;
  }): Promise<boolean> {
    const sql = this.flag("DOLT_CLONE", [
      [options.branch, `'--branch', '${options.branch}'`, ""],
      [options.remote, `'--remote', '${options.remote}'`, ""],
      [options.depth, `'--depth', '${options.depth}'`, ""],
      [options.from, `'${options.from}'`, ""],
      [options.to, `'${options.to}'`, ""],
    ]);
    console.log("sql :>> ", sql);
    const res = (await this.query(sql)) as ResultSetHeader;
    return res.affectedRows > 0;
  }

  /**
   *Stages the changes to the selected tables if no tables are passed all tables are staged
   *
   * @param {string[]} [tables] The tables to stage
   * @return {*} {Promise<boolean>}
   * @memberof Dolt
   */
  async Stage(tables?: string[]) {
    let sql = "";
    if (tables) {
      sql = `CALL DOLT_STAGE(${tables
        .map((table) => "'" + table + "'")
        .join(",")});`;
    } else {
      sql = `CALL DOLT_ADD('-A');`;
    }
    const res = (await this.query(sql)) as ResultSetHeader;
    return res.affectedRows > 0;
  }

  async Commit(
    message: string,
    options: {
      author?: string;
      date?: string;
      allButNotNewTables?: boolean;
      all?: boolean;
      allowEmpty?: boolean;
      skipEmpty?: boolean;
    }
  ) {
    const sql = this.flag("DOLT_COMMIT", [
      [message, `'-m', '${message}'`, ""],
      [options.date || "", `'--date', '${options.date}'`, ""],
      [String(options.all)!!, `'-A'`, ""],
      [String(options.allButNotNewTables)!!, `'${options.to}'`, ""],
    ]);

    const res = (await this.query(sql)) as ResultSetHeader;
    return res.affectedRows > 0;
  }
}
