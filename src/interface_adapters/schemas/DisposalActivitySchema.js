const mongoose = require('mongoose');

const DisposalActivitySchema = new mongoose.Schema({
    userId: {
         type: mongoose.Schema.Types.ObjectId, 
         ref: 'User',
          required: true 
        },

    wasteType: { 
        type: String,
         required: true ,
        enum: ['plastic', 'paper', 'metal', 'glass', 'organic', 'other']
        },

    quantity: { 
        type: Number, 
        required: true ,
        min:0
       },
       
       weight: { 
    type: Number, 
    required: true,
    min: 0
     },

       unit: { 
    type: String, 
    required: true,
    enum: ['kg', 'g', 'lbs', 'oz'],
    default: 'kg'
  },
    timestamp: { 
    type: Date, 
    default: Date.now 
  }
});
module.exports = mongoose.model('DisposalActivity', DisposalActivitySchema);