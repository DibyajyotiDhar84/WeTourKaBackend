import {model,Schema} from 'mongoose';

const passengerSchema = new Schema({
    name: { type: String, required: true },
    ticket_number: { type: String, unique: true }, 
    seat: { type: String, required: true },
    class: { type: String, enum: ["Economy", "Business", "First"], required: true },
    passport_number: String,
    age: Number
});

passengerSchema.methods.generateTicketNumber = async function(airlinePrefix) {
    const uniqueRef = await Math.floor(1000000000 + Math.random() * 9000000000).toString();
    this.ticket_number = `${airlinePrefix} ${uniqueRef}`;
};


export const passengerModel=model("passengers",passengerSchema);