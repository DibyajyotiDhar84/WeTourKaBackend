import { model, Schema} from 'mongoose'

const flightBookingSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true },
    instance_id: { type: Schema.Types.ObjectId, ref: "FlightInstance", required: true },
    pnr_number: { type: String, unique: true },
    
    passengers: [{ type: Schema.Types.ObjectId, ref: "passengers" }],
    
    total_price: Number,
    booking_status: { type: String, enum: ["Confirmed", "Cancelled"], default: "Confirmed" },
    booked_at: { type: Date, default: Date.now }

});

flightBookingSchema.pre('save', function() {
    if (!this.pnr_number) {
        this.pnr_number = Math.random().toString(36).substring(2, 8).toUpperCase();
    }
});

export const flightBookingModel = model("flightBookings",flightBookingSchema);