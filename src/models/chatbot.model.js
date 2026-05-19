import {Schema,model} from "mongoose";

const chatSchema = new Schema({

    userId: { 
    type: Schema.Types.ObjectId,
    ref:'users', 
    required: true, 
    index: true 
  },
  messages: [
    {
      role: { 
        type: String, 
        enum: ['user', 'model'], 
        required: true 
      },
      parts: [{ 
        text: { type: String, required: true } 
      }],
      sentAt: { type: Date, default: Date.now } 
    }
  ]
},{timestamps: true});

chatSchema.methods.addMessage = async function(role, text) {
  await this.messages.push({
    role,
    parts: [{ text }]
  });
  return await this.save();
};

chatSchema.methods.clearHistory = async function() {
  this.messages = [];
  return await this.save();
};


export const chatModel =model('chats',chatSchema);