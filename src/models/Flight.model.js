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
    departure_time: { type: String, required: true },
    arrival_time: { type: String, required: true },
    days_of_week: { 
        type: [Number], 
        default: [0, 1, 2, 3, 4, 5, 6] // 0=Sun, 6=Sat
    },
    aircraft: {
        model: String,
        capacity: Number
    },
    seats: [
        {
            seat_number: String,
            class: { type: String, enum: ["Economy", "Business", "First"] },
        }
    ],
    base_price: { type: Number, required: true }


});

flightSchema.index({'origin.airport_code':'text',
                    'destination.airport_code':'text',
                    "origin.city": "text", 
                    "destination.city": "text"});



flightSchema.index({ flight_number: 1, departure_time: 1 }, { unique: true });

flightSchema.pre('save', function () {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(this.departure_time) || !timeRegex.test(this.arrival_time)) {
        throw new ApiError(400, "Times must be in HH:mm format");
    }
});

export const flightModel = model("flights",flightSchema);