/* eslint-disable no-use-before-define */
import { Model, InferAttributes, InferCreationAttributes, DataTypes, Sequelize, CreationOptional } from 'sequelize'// We export a function that defines the model.

// We export a function that defines the model.
// This function will automatically receive as parameter the Sequelize connection object.
export class Artist extends Model<InferAttributes<Artist>, InferCreationAttributes<Artist>> {
  declare id: CreationOptional<string>
  declare name: string
  declare image: string
  declare bio: string
}
export default (sequelize: Sequelize) => {
  Artist.init({
    // The following specification of the 'id' attribute could be omitted
    // since it is the default.
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      allowNull: false,
      type: DataTypes.STRING
    },
    image: {
      allowNull: true,
      type: DataTypes.STRING
    },
    bio: {
      allowNull: true,
      type: DataTypes.STRING
    }

  }, { sequelize, tableName: 'artists' })
}
