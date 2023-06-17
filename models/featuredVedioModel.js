import mongoose from "mongoose";

const schema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
  },
  vedioUrl: {
    public_id: String,
    url: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
export const FeaturedVideo = mongoose.model("FeaturedVideo", schema);

