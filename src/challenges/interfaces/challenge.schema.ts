import * as mongoose from 'mongoose';

export const ChallengeSchema = new mongoose.Schema(
  {
    date: { type: Date },
    status: { type: String },
    solicitationDate: { type: Date },
    answerDate: { type: Date },
    challenger: { type: mongoose.Schema.Types.ObjectId },
    category: { type: mongoose.Schema.Types.ObjectId },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    play: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Play',
    },
  },
  { timestamps: true, collection: 'challenges' },
);
