import { Schema, model, Document, Types } from 'mongoose';

export type TripSharePermission = 'read';

export interface ITripShare extends Document {
  trip: Types.ObjectId;
  tokenHash: string;
  permissions: TripSharePermission;
  isActive: boolean;
  expiresAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const tripShareSchema = new Schema<ITripShare>(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip reference is required'],
      index: true,
    },
    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
      unique: true,
      index: true,
    },
    permissions: {
      type: String,
      enum: {
        values: ['read'],
        message: 'Only "read" permission is supported currently',
      },
      default: 'read',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
    },
    revokedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const TripShare = model<ITripShare>('TripShare', tripShareSchema);
