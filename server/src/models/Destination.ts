import { Schema, model, Document, Types } from 'mongoose';

export interface IDestination extends Document {
  trip: Types.ObjectId;
  city: string;
  country: string;
  arrivalDate: Date;
  departureDate: Date;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const destinationSchema = new Schema<IDestination>(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip reference is required'],
      index: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    arrivalDate: {
      type: Date,
      required: [true, 'Arrival date is required'],
    },
    departureDate: {
      type: Date,
      required: [true, 'Departure date is required'],
      validate: {
        validator: function (this: IDestination, value: Date): boolean {
          if (!this.arrivalDate || !value) return true;
          return value >= this.arrivalDate;
        },
        message: 'Departure date must be on or after arrival date',
      },
    },
    order: {
      type: Number,
      required: [true, 'Order sequence is required'],
      min: [0, 'Order cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Order must be an integer',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring no duplicate order index per trip
destinationSchema.index({ trip: 1, order: 1 }, { unique: true });

export const Destination = model<IDestination>('Destination', destinationSchema);
