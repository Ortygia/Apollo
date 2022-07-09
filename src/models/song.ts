/* eslint-disable no-use-before-define */
import { Model, InferAttributes, InferCreationAttributes, DataTypes, Sequelize, TEXT } from 'sequelize'// We export a function that defines the model.
// This function will automatically receive as parameter the Sequelize connection object.// Exported to load into sequelize
// Exported to to use in files

export class Song extends Model<InferAttributes<Song>, InferCreationAttributes<Song>> {
  declare id: string
  declare path: string
  declare title: string
  declare disk: number
  declare artist: string
  declare album: string
  declare codec: string
  declare sampleRate: number
  declare bitsPerSample: number
  declare track: number
  declare year: number
  declare label: Array<string>
  declare musicBrainzRecordingId: string
  declare musicBrainzArtistId: Array<string>
  declare musicBrainzTrackId: string
  declare albumId: string
}

// Exported to load into sequelize
export default (sequelize: Sequelize) => {
  Song.init({
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
    title: {
      allowNull: false,
      type: DataTypes.STRING
    },
    disk: {
      type: DataTypes.INTEGER
    },
    artist: {
      allowNull: false,
      type: DataTypes.STRING
    },
    album: {
      allowNull: false,
      type: DataTypes.STRING
    },
    codec: {
      type: DataTypes.STRING
    },
    sampleRate: {
      type: DataTypes.INTEGER
    },
    bitsPerSample: {
      type: DataTypes.INTEGER
    },
    track: {
      type: DataTypes.INTEGER
    },
    year: {
      type: DataTypes.INTEGER
    },
    label: {
      type: DataTypes.ARRAY(TEXT)
    },
    musicBrainzRecordingId: {
      allowNull: true,
      type: DataTypes.STRING
    },
    musicBrainzArtistId: {
      allowNull: true,
      type: DataTypes.ARRAY(TEXT)
    },
    musicBrainzTrackId: {
      allowNull: true,
      type: DataTypes.STRING
    },
    albumId: {
      allowNull: true,
      type: DataTypes.UUIDV4
    }
  }, {
    sequelize,
    tableName: 'songs',
    indexes: [
      {
        unique: true,
        fields: ['path']
      }
    ]
  }
  )
}
