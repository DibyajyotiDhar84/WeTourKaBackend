import { Schema,model } from "mongoose";
import { flightModel } from "./Flight.model.js";

const flightInstanceSchema = new Schema({
    template_id:{type:Schema.Types.ObjectId,ref:"flights",required:true},
    date:{type:Date , required:true},
    booked_seats:[String],
    status:{
       type: String,
       enum: ["Scheduled", "Delayed", "Cancelled", "Completed"],
       default: "Scheduled" 
    },
    crew: [
        {
            name: String,
            role: String
        }
    ],
    current_price:Number
});

flightInstanceSchema.index({ template_id: 1, date: 1 }, { unique: true });

flightInstanceSchema.methods.getAvailableSeatCount=async function () {
    const template = await flightModel.findById(this.template_id);
    return template.aircraft.capacity-this.booked_seats.length;
    
};

flightInstanceSchema.methods.isSeatBooked = function (seatNumber) {
    return this.booked_seats.includes(seatNumber);
};

export const flightInstanceModel= model("FlightInstance",flightInstanceSchema);
