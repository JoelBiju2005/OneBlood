const { Sequelize } = require('sequelize');
const path = require('path');

const dbPath = path.join(__dirname, '../../database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false, // Set to console.log if SQL queries debugging is needed
  define: {
    timestamps: true,
  }
});

module.exports = sequelize;
