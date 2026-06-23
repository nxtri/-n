require('dotenv').config();
const { Sequelize } = require('sequelize');

const databaseUrl = process.env.DATABASE_URL;
const isLocalDatabase = /@(localhost|127\.0\.0\.1)(:|\/)/i.test(databaseUrl || '');
const shouldUseSsl = process.env.DB_SSL
  ? process.env.DB_SSL === 'true'
  : !isLocalDatabase;

const sequelizeOptions = {
  dialect: 'postgres',
  logging: false,
};

if (shouldUseSsl) {
  sequelizeOptions.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  };
}

const sequelize = new Sequelize(databaseUrl, sequelizeOptions);

module.exports = sequelize;
