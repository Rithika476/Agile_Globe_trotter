import { Schema, model, Document, Types } from 'mongoose';

export interface ITrip extends Document {
  owner: Types.ObjectId;
  title: string;
  startDate: Date;
  endDate: Date;
  estimatedBudget: number;
  createdAt: Date;
  updatedAt: Date;
}

const tripSchema = new Schema<ITrip>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Trip title is required'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (this: ITrip, value: Date): boolean {
          if (!this.startDate || !value) return true;
          return value >= this.startDate;
        },
        message: 'End date must be on or after start date',
      },
    },
    estimatedBudget: {
      type: Number,
      min: [0, 'Estimated budget cannot be negative'],
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Trip = model<ITrip>('Trip', tripSchema);
