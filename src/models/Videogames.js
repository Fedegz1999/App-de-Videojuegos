const { DataTypes, UUIDV4} = require('sequelize');
// Exportamos una funcion que define el modelo
// Luego le injectamos la conexion a sequelize.
module.exports = (sequelize) => {
  // defino el modelo
  sequelize.define('videogame', {
    id:{
      type: DataTypes.UUID,
      defaultValue : UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      unique:true,
      allowNull:false
    }, 
    description: {
      type: DataTypes.STRING,
      // allowNull: false
    },
    released_date: {
      type: DataTypes.STRING
    },
    rating:{
      type: DataTypes.INTEGER
    },
    platforms:{
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false
    },
    image: {
      type: DataTypes.STRING
    } 
  },{
    timestamps: false,
    freezeTableName: true,
    
  });
};
