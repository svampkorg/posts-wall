import Mongoose from 'mongoose';

const userSchema = Mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: [
      {
        validator: function(v) {
          return /\S+@\S+\.\S+/.test(v);
        },
        message: props => `${props.value} is not a valid email!`
      },
      {
        validator: async function(v) {
          const userCount = await this.model('User').countDocuments({ email: v });
          return !userCount; // Ensure the email is unique
        },
        message: props => `${props.value} already exists!`
      }
    ]
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: false,
    default: '',
  }
});

const User = Mongoose.model('User', userSchema);
User.init();

export default User;
