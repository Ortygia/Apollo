/* eslint-disable no-use-before-define */
import { Model, InferAttributes, InferCreationAttributes, DataTypes, Sequelize } from 'sequelize'// We export a function that defines the model.

// We export a function that defines the model.
// This function will automatically receive as parameter the Sequelize connection object.
export class Album extends Model<InferAttributes<Album>, InferCreationAttributes<Album>> {
  declare id: string
  declare path: string
  declare name: string
  declare year: number

  // there is no need to use CreationOptional on firstName because nullable attributes
  // are always optional in User.create()
}
export default (sequelize: Sequelize) => {
  Album.init({
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
    name: {
      allowNull: false,
      type: DataTypes.STRING
    },
    year: {
      allowNull: false,
      type: DataTypes.INTEGER
    }
  }, { sequelize, tableName: 'albums' })
}
