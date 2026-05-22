import { Schema, model } from 'mongoose';


const hotelSchema = new Schema(
    {
        user_id:{
            type:Schema.Types.ObjectId,
            ref:'users',
            required:true
        },
        name:{
            type:String,
            required:true,
        },
        location:{
            type:String,
            required:true,
        },
        roomsAvailable:{
           standard:{
                type:Number,
                default:0,
                required:true,
           },
           deluxe:{
            type:Number,
            default:0,
            required:true,
           }
        },
        rating:{
            type:Schema.Types.ObjectId,
            ref:'Reviews', 
        },
        pricePerNight:{
            standard:{
                type:Number,
                required:true,
            },
            deluxe:{
                type:Number,
                required:true
            }
        },
        imageUrl:{
            type:String,
            required:true,
        },
        images:[{
            type:String,
        }],
        amenities:[{
            type:String
        }]
    },
    {
        timestamps:true,
    }
)

export const hotelModel = model("Hotels",hotelSchema);