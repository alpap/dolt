import type { Connection, ResultSetHeader } from "mysql2/promise";

export class Dolt {
  private conn: Connection;
  constructor(mysqlConnection: Connection) {
    this.conn = mysqlConnection;
  }

  private async query(sql: string) {
    const [rows] = await this.conn.query(sql);
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
  async CloneDatabase(
    from: string,
    options: {
      branch?: string;
      remote?: string;
      depth?: number;
      to?: string;
    }
  ): Promise<boolean> {
    const sql = this.flag("DOLT_CLONE", [
      [options.branch, `'--branch', '${options.branch}'`, ""],
      [options.remote, `'--remote', '${options.remote}'`, ""],
      [options.depth, `'--depth', '${options.depth}'`, ""],
      [from, `'${from}'`, ""],
      [options.to, `'${options.to}'`, ""],
    ]);
    const res = (await this.query(sql)) as ResultSetHeader;
    return res.affectedRows > 0;
  }

  /**
   *Stages the changes to the selected tables if no tables are passed all tables are staged
   *
   * @param {string[]} [tables] The tables to stage
   * @return {*} {Promise<boolean>} returns true if successful
   * @memberof Dolt
   */
  async Add(tables?: string[]): Promise<boolean> {
    let sql = "";
    if (tables) {
      sql = `CALL DOLT_ADD(${tables
        .map((table) => "'" + table + "'")
        .join(",")});`;
    } else {
      sql = `CALL DOLT_ADD('-A');`;
    }
    const res = (await this.query(sql)) as { status: number }[];
    return res[0].status === 0;
  }

  /**
   * Commits the staged changes or all
   *
   * https://docs.dolthub.com/sql-reference/version-control/dolt-sql-procedures#dolt_commit
   * @param {string} message
   * @param {{
   *       author?: string;
   *       date?: string;
   *       allButNotNewTables?: boolean;
   *       all?: boolean;
   *       allowEmpty?: boolean;
   *       skipEmpty?: boolean;
   *     }} [options]
   * @return {*}  {Promise<string>} The commit sha
   * @memberof Dolt
   */
  async Commit(
    message: string,
    options?: {
      author?: string;
      date?: string;
      allButNotNewTables?: boolean;
      all?: boolean;
      allowEmpty?: boolean;
      skipEmpty?: boolean;
    }
  ): Promise<string> {
    const sql = this.flag("DOLT_COMMIT", [
      [message, `'--message', '${message}'`, ""],
      [options?.date, `'--date', '${options?.date}'`, ""],
      [options?.all, `'--ALL'`, ""],
      [options?.allButNotNewTables, `'--all'`, ""],
      [options?.author, `'--author', '${options?.author}'`, ""],
      [options?.allowEmpty, `'--allow-empty'`, ""],
      [options?.skipEmpty, `'--skip-empty'`, ""],
    ]);

    const res = (await this.query(sql)) as { hash: string }[];
    return res[0].hash;
  }

  /**
   *Resets the tables to be commited or if hard mode is set all changes to a commit or branch
   *
   * @param {string} table
   * @param {{
   *       hard?: string;
   *     }} options
   * @return {*}
   * @memberof Dolt
   */
  async Reset(
    table: string,
    options?: {
      hard?: boolean;
    }
  ) {
    const sql = this.flag("DOLT_RESET", [
      [table && !options?.hard, `'${table}'`, ""],
      [options?.hard && table, `'--hard', '${table}'`, ""],
      [options?.hard && !table, `'--hard'`, ""],
    ]);

    const res = (await this.query(sql)) as { status: number }[];
    return res[0].status === 0;
  }

  /**
   *Reverts the changes introduced in a commit, or set of commits. Creates a new commit from the current HEAD that reverses
   *
   * https://docs.dolthub.com/sql-reference/version-control/dolt-sql-procedures#dolt_revert
   *
   * @param {string} ref
   * @param {{
   *       author?: string;
   *     }} [options]
   * @return {*}
   * @memberof Dolt
   */
  async Revert(
    ref: string,
    options?: {
      author?: string;
    }
  ) {
    const sql = this.flag("DOLT_RESET", [
      [ref, `'${ref}'`, ""],
      [options?.author, `'--author=${options?.author}'`, ""],
    ]);

    const res = (await this.query(sql)) as { status: number }[];
    return res[0].status === 0;
  }

  /**
   *Creates a new tag that points at specified commit ref, or deletes an existing tag
   *
   * https://docs.dolthub.com/sql-reference/version-control/dolt-sql-procedures#dolt_tag
   *
   * @param {string} tag
   * @param {string} ref
   * @param {{
   *       message?: string;
   *       author?: string;
   *       delete?: boolean;
   *     }} [options]
   * @return {*}
   * @memberof Dolt
   */
  async Tag(
    tag: string,
    ref: string,
    options?: {
      message?: string;
      author?: string;
    }
  ) {
    const sql = this.flag("DOLT_TAG", [
      [tag, `'${tag}', '${ref}'`, ""],
      [options?.author, `'--author=${options?.author}'`, ""],
      [options?.message, `'--message', '${options?.message}'`, ""],
    ]);

    const res = (await this.query(sql)) as { status: number }[];
    return res[0].status === 0;
  }
}
