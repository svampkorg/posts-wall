import Mongoose from 'mongoose';

const postSchema = Mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  imagePath: {
    type: String,
    required: true,
  },
  author: {
    type: Mongoose.Schema.Types.ObjectId, ref: 'User', required: true
  },
});

const Post = Mongoose.model('Post', postSchema);
Post.init();

export default Post;
