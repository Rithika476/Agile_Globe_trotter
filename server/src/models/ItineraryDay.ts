import { Schema, model, Document, Types } from 'mongoose';

export interface IItineraryDay extends Document {
  trip: Types.ObjectId;
  destination: Types.ObjectId;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const itineraryDaySchema = new Schema<IItineraryDay>(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip reference is required'],
      index: true,
    },
    destination: {
      type: Schema.Types.ObjectId,
      ref: 'Destination',
      required: [true, 'Destination reference is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring only one itinerary day per calendar date in a trip
itineraryDaySchema.index({ trip: 1, date: 1 }, { unique: true });

export const ItineraryDay = model<IItineraryDay>('ItineraryDay', itineraryDaySchema);
