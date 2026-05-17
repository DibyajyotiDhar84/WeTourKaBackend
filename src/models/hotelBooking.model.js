import { Schema, model } from 'mongoose';

const bookingSchema = Schema(
    {
        userId:{
            type:Schema.Types.ObjectId,
            ref:'users',
            require:true,
        },
        hotelId:{
            type:Schema.Types.ObjectId,
            ref:'Hotels',
            required:true,
        },
        travellers:[
            {
               name:{type:String, required:true},
               email:{type:String, required:true},
               phone:{type:String, required:true}
            },

        ],
        totalPrice:{
            type:Number,
            required:true,
        },
        roomType:{
            type:String,
            required:true,
            enum:['standard','deluxe']
        },
        numRoomsBooked:{
            type:Number,
            required:true,
            default:1
        },
        checkInDate:{
            type:Date,
            required:true,
        },
        checkOutDate:{
            type:Date,
            required:true
        },
        status:{
            type:String,
            enum:['confirmed','cancelled','pending','completed'],
            default:'pending'
        }

    },
    {
        timestamps:true,
    }

)

export const BookingModel = model("BookedHotel", bookingSchema);

