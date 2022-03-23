const sequelize = require('./sequelize')
const SequelizeAuto = require('sequelize-auto')

const options = { caseFile: 'l', caseModel: 'p', caseProp: 'c' };
const db = new SequelizeAuto(sequelize, null, null, options)

db.run().then(() => { console.log("Postgres Database is connected and models have been auto generated") })
  .catch((err) => { console.log("Error" + err) })

