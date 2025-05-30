import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum LinkPrecedence {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
}

interface ContactAttributes {
  id: number;
  phoneNumber?: string | null;
  email?: string | null;
  linkedId?: number | null;
  linkPrecedence: LinkPrecedence;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

interface ContactCreationAttributes extends Optional<ContactAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'linkedId'> {}

class Contact extends Model<ContactAttributes, ContactCreationAttributes> implements ContactAttributes {
  public id!: number;
  public phoneNumber?: string | null;
  public email?: string | null;
  public linkedId?: number | null;
  public linkPrecedence!: LinkPrecedence;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt?: Date | null;
}

Contact.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    linkedId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Contacts', // This is the table name
        key: 'id',
      },
    },
    linkPrecedence: {
      type: DataTypes.ENUM(LinkPrecedence.PRIMARY, LinkPrecedence.SECONDARY),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'Contacts', // Explicitly set table name
    timestamps: true, // Enables createdAt and updatedAt
    paranoid: true, // Enables soft deletes (deletedAt)
    indexes: [
      { fields: ['email'] },
      { fields: ['phoneNumber'] },
      { fields: ['linkedId'] },
    ]
  }
);

export default Contact;