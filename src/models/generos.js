const { DataTypes, UUIDV4 } = require('sequelize');

module.exports = sequelize => {
  sequelize.define('genre', {
    name: {
      type: DataTypes.STRING

    },
    id:{
      type: DataTypes.UUID,
      defaultValue : UUIDV4,
      primaryKey: true,
    }
  },{
    timestamps: false
  });
}