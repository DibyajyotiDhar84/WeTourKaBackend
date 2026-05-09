import { Schema, model } from 'mongoose';
import ApiError from '../utils/apiError.js';

const flightSchema = new Schema({

    flight_number: { type: String, required: true},
    airline: {
        name: String,
        iata_code: String
    },
    origin: {
        airport_code: {type:String,required:true}, 
        city: String,
        country: String,
    },
    destination: {
        airport_code: {type:String,required:true},
        city: String,
        country: String
    },
    departure_time: { type: Date, required: true },
    arrival_time: { type: Date, required: true },
    status: {
        type: String,
        enum: ["Scheduled", "Delayed", "Cancelled", "Completed"],
        default: "Scheduled",
        index:true,
    },
    aircraft: {
        model: String,
        capacity: Number
    },
    seats: [
        {
            seat_number: String,
            class: { type: String, enum: ["Economy", "Business", "First"] },
            is_available: { type: Boolean, default: true }
        }
    ],
    crew: [
        {
            name: String,
            role: String
        }
    ],

});

flightSchema.pre('save',function () {
    if(this.arrival_time<=this.departure_time){
        throw new ApiError(400,"arivalTime cannot be before DepurtureTime")
    }    
});

flightSchema.pre('save', function() {
    const now = new Date();
    if (now > this.arrival_time && this.status !== 'Cancelled') {
        this.status = 'Completed';
    }
    
});

flightSchema.methods.getAvailableSeatCount = function(){
    return this.seats.filter(seat=>seat.is_available).length;
};

flightSchema.methods.bookSeat = async function (seatNumber) {
    const seat = await this.seats.find(s=>s.seat_number===seatNumber);
    if(!seat)throw new ApiError(404,"Seat does not exist on this aircraft.");

    if(!seat.is_available)throw new ApiError(400,"Seat is already booked");

    seat.is_available=false;
    
};

// Add this at the bottom of your model file
flightSchema.index({ flight_number: 1, departure_time: 1 }, { unique: true });

export const flightModel = model("flights",flightSchema);