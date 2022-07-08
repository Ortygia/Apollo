import { DataTypes, Sequelize } from 'sequelize'

// We export a function that defines the model.
// This function will automatically receive as parameter the Sequelize connection object.
export default (sequelize: Sequelize) => {
  sequelize.define('directory', {
    // The following specification of the 'id' attribute could be omitted
    // since it is the default.
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    path: {
      allowNull: false,
      type: DataTypes.STRING
    },
    mtime: {
      allowNull: false,
      type: DataTypes.TIME
    }
  })
}
