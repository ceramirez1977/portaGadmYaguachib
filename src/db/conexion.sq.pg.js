const {Sequelize} = require('sequelize');
const {getConnPG} = require('../gen/rutasScgp');

const connPG = getConnPG();
console.log('conexion.sq.pg ',connPG);
const sequelize = new Sequelize(connPG.database,connPG.user,connPG.password,{
  host:connPG.host,
  port:connPG.port,
  dialect:'postgres'
});

module.exports = {
    sequelize
}
