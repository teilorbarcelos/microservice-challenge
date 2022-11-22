import * as mongoose from 'mongoose';

export const PlaySchema = new mongoose.Schema(
  {
    challenge: { type: mongoose.Schema.Types.ObjectId },
    category: { type: mongoose.Schema.Types.ObjectId },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    def: { type: mongoose.Schema.Types.ObjectId },
    result: [{ set: { type: String } }],
  },
  { timestamps: true, collection: 'plays' },
);
