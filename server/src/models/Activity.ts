import { Schema, model, Document, Types } from 'mongoose';

export type ActivityCategory =
  | 'transport'
  | 'accommodation'
  | 'food'
  | 'sightseeing'
  | 'activities'
  | 'shopping'
  | 'other';

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  'transport',
  'accommodation',
  'food',
  'sightseeing',
  'activities',
  'shopping',
  'other',
];

export interface IActivity extends Document {
  trip: Types.ObjectId;
  itineraryDay: Types.ObjectId;
  title: string;
  description?: string;
  location?: string;
  startTime?: Date;
  endTime?: Date;
  category: ActivityCategory;
  estimatedCost: number;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip reference is required'],
      index: true,
    },
    itineraryDay: {
      type: Schema.Types.ObjectId,
      ref: 'ItineraryDay',
      required: [true, 'Itinerary day reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Activity title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
      validate: {
        validator: function (this: IActivity, value?: Date): boolean {
          if (!this.startTime || !value) return true;
          return value > this.startTime;
        },
        message: 'End time must be after start time',
      },
    },
    category: {
      type: String,
      enum: {
        values: ACTIVITY_CATEGORIES,
        message: '{VALUE} is not a valid activity category',
      },
      default: 'other',
    },
    estimatedCost: {
      type: Number,
      min: [0, 'Estimated cost cannot be negative'],
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Activity = model<IActivity>('Activity', activitySchema);
