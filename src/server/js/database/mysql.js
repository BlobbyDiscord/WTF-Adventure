import mysql from 'mysql';
import _ from 'underscore';
import log from '../util/log';
import Creator from './creator';
import Loader from './loader';
import Config from '../../config.json';

export default class MySQL {
  constructor(host, port, user, pass, database) {
    /**
     * Main file for MySQL, it splits into Creator and Loader.
     * Responsible for creating and loading data, respectively.
     */
    this.host = host;
    this.port = port;
    this.user = user;
    this.password = pass;
    this.database = database;

    this.loader = null;

    this.connect(
      true,
      false,
    );

    this.loadCreator();
    this.loadCallbacks();
  }

  connect(usingDB, forceCallbacks) {
    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
    }

    this.connection = mysql.createConnection({
      host: this.host,
      port: this.port,
      user: this.user,
      password: this.password,
      database: usingDB ? this.database : null,
    });

    if (forceCallbacks) this.loadCallbacks();
  }

  loadCallbacks() {
    this.connection.connect((error) => {
      if (error) {
        console.log('[MySQL] No database found...');
        console.log(error);
        this.connect(
          false,
          false,
        );
        this.loadDatabases();
        return;
      }

      this.creator.createTables();
      console.log('Successfully established connection to the MySQL database!');
      this.loader = new Loader(this);
    });

    this.connection.on('error', (error) => {
      log.error('MySQL database disconnected.');
      log.error(error);

      this.connect(
        true,
        true,
      );
    });

    this.onSelected(() => {
      this.creator.createTables();
    });
  }

  loadCreator() {
    if (this.creator) return;

    this.creator = new Creator(this);
  }

  login(player) {
    let
      found;

    console.log(`Initiating login for: ${player.username}`);

    this.connection.query(
      'SELECT * FROM `player_data`, `player_equipment` WHERE `player_data`.`username`= ? AND `player_data`.`password`= ?',
      [player.username, player.password],
      (error, rows) => {
        if (error) {
          log.error(error);
          throw error;
        }

        _.each(rows, (row) => {
          if (row.username === player.username) {
            found = true;

            const data = row;

            data.armour = data.armour.split(',').map(Number);
            data.weapon = data.weapon.split(',').map(Number);
            data.pendant = data.pendant.split(',').map(Number);
            data.ring = data.ring.split(',').map(Number);
            data.boots = data.boots.split(',').map(Number);

            player.load(data);
            player.intro();
          }
        });

        if (player.isGuest) {
          // register the guest account
          this.register(player);
        } else if (!found) {
          console.log(`Mysql.login(player) failed for ${player.username}`);
          player.invalidLogin();
        }
      },
    );
  }

  register(player) {
    this.connection.query(
      'SELECT * FROM `player_data` WHERE `player_data`.`username`= ?',
      [player.username],
      (error, rows) => {
        let exists;

        if (error) {
          log.error(error);
          throw error;
        }

        _.each(rows, (row) => {
          if (row.name === player.username) exists = true;
        });

        if (!exists) {
          console.log(`No player data found for: ${player.username}`);

          player.isNew = true; // eslint-disable-line
          player.load(this.creator.getPlayerData(player));

          this.creator.save(player);

          player.isNew = false; // eslint-disable-line
          player.intro();
        } else {
          console.log('MySQL.register(player) Error: Username already exists.');
          player.notify('This username is already taken!');
        }
      },
    );
  }

  delete(player) {
    const
      tables = [
        'player_data',
        'player_equipment',
        'player_inventory',
        'player_abilities',
        'player_bank',
        'player_quests',
        'player_achievements',
      ];

    _.each(tables, (table) => {
      this.connection.query(
        `DELETE FROM \`${table}\` WHERE \`${table}\`.\`username\`=?`,
        [player.username],
        (error) => {
          if (error) {
            log.error(`Error while deleting user: ${player.username}`);
          }
        },
      );
    });
  }

  loadDatabases() {
    console.log('[MySQL] Creating database....');

    this.connection.query(
      `CREATE DATABASE IF NOT EXISTS ${Config.mysqlDatabase}`,
      (error) => {
        if (error) {
          throw error;
        }

        console.log('[MySQL] Successfully created database.');

        this.connection.query(`USE ${Config.mysqlDatabase}`, () => {
          if (this.selectDatabase_callback) {
            this.selectDatabase_callback();
          }
        });
      },
    );
  }

  queryData(type, database, data) {
    this.connection.query(`${type} ${database} SET ?`, data, (
      error,
    ) => {
      if (error) {
        throw error;
      }

      console.log(`Successfully updated ${database}`);
    });
  }

  alter(database, column, type) {
    this.connection.query(
      `ALTER TABLE ${database} ADD ${column} ${type}`,
      (error) => {
        if (error) {
          log.error('Malformation in the database type and/or type.');
          return;
        }

        console.log(`Database ${database} has been successfully altered.`);
      },
    );
  }

  onSelected(callback) {
    this.selectDatabase_callback = callback;
  }
}
