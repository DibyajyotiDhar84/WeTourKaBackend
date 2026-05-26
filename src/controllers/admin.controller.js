import { flightModel } from '../models/Flight.model.js';
import { flightBookingModel } from '../models/flightBooking.model.js';
import { flightInstanceModel } from '../models/flightInstance.model.js';
import { UserModel } from '../models/User.model.js';
import ApiError from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import { Package } from '../models/package.model.js';
import { hotelModel } from '../models/hotel.model.js';
import { BookingModel } from '../models/hotelBooking.model.js';
import {Booking} from '../models/package.booking.model.js';
import { populate } from 'dotenv';




export const getAllUsers= asyncHandler(async(req,res)=>{

    const users = await UserModel.find({role:{$ne:"ADMIN"}}).select("-password");
    if(!users)throw new ApiError(404,"could not find users");
    

    res.status(200).json(
        new ApiResponse(200,"users fetched sucessfully",users,true)
    )

});



export const addFlight =asyncHandler(async(req,res)=>{

    const {
            flight_number, airline, origin, destination,departure_time,
            arrival_time, aircraft, days_of_week, base_price
        } = req.body;


    if([flight_number,departure_time,arrival_time].some((f)=>f.trim()=="") || !base_price ||!origin ||!destination){
        throw new ApiError(400,"provide required fields");
    }
    

    const existingFlight = await flightModel.findOne({flight_number,departure_time});
    if(existingFlight){
        throw new ApiError(400,"A flight with this number at this time already exists.")
    }

    const seats = [];
    const rows = Math.ceil(aircraft.capacity / 6); // 6 seats per row (A-F)
    const seatLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

    for (let i = 1; i <= rows; i++) {
        for (let letter of seatLetters) {
            if (seats.length < aircraft.capacity) {
                let seatClass = "Economy";
                if (i <= 2) seatClass = "First";
                else if (i <= 5) seatClass = "Business";

                    seats.push({
                        seat_number: `${i}${letter}`,
                        class: seatClass,
            
                    });
                }
            }
        }

    
        const newFlight = await flightModel.create({
            flight_number,
            airline,
            origin,
            destination,
            departure_time,
            arrival_time,
            aircraft,
            days_of_week: days_of_week || [0, 1, 2, 3, 4, 5, 6],
            seats,
            base_price
        });

        return res.status(201).json(
            new ApiResponse(201,"Flight created sucessfully",newFlight,true)
        );

});

export const allFlights=asyncHandler(async(req,res)=>{

    const flightInstance= await flightInstanceModel.find().populate('template_id');
    if(!flightInstance){
        throw new ApiError(404,"No flights instances");
    }

    res.status(200).json(
        new ApiResponse(200,"All flights Instances fetch successfully",flightInstance,true)
    )

});

export const cancelFlight=asyncHandler(async(req,res)=>{
    const {fIid}=req.query;
    if(!fIid){
        throw new ApiError(400,"provide flight instance Id")
    }
    const flightIns = await flightInstanceModel.findOne({_id:fIid});
    if(!flightIns){
        throw new ApiError(404,"flight instance couldn't found with given instance id")
    }
    if (flightIns.status === "Cancelled") {
        throw new ApiError(400, "This flight is already cancelled");
    }

    flightIns.status="Cancelled";
    await flightIns.save();

    // const allBookings = await flightBookingModel.find({instance_id:fIid,booking_status:'Confirmed'});

    // for(let booking of allBookings){
        //refund logic--->>
    // }


    await flightBookingModel.updateMany(
        { 
            instance_id: fIid, 
            booking_status: "Confirmed" 
        },
        { 
            $set: { booking_status: "Cancelled" } 
        }
    );



    res.status(200).json(
        new ApiResponse(200,"Flight cancelled successfully",flightIns,true)
    )
});


export const getAllPackages = asyncHandler(async (req, res) => {
  const packages = await Package.find()
                                .populate('user_id', 'name email');
  res.status(200).json(new ApiResponse(200, "All Packages found", packages, true));
});


export const getAllHotels = asyncHandler(async(req,res)=>{

    let hotels = await hotelModel.find().populate('user_id','name email');
    
        if(!hotels){
            throw new ApiError(404,"NO hotels exists ");
        }
    
        res.status(201).json(
            new ApiResponse(201, "All Hotels found", hotels, true)
        );

});


export const getAllHPFBookings = asyncHandler(async(req,res)=>{
 
    const [flightBooking,hotelBooking,packageBooking]= await Promise.all([
        flightBookingModel.find().populate('user_id','name')
                                 .populate({path: 'instance_id', select: 'date', populate: {path: 'template_id',select: 'flight_number origin.city destination.city'}}),


        BookingModel.find().populate('userId','name')
                            .populate('hotelId','name'),

        Booking.find().populate('user_id','name')
                       .populate('package_id','destination start_date end_date')
    ]);

    const transformdFlight = flightBooking.map(f=>({
        bookingId:f._id,
        type:'Flight',
        title:`${f.instance_id?.template_id?.origin?.city}-->${f.instance_id?.template_id?.destination?.city}`,
        status:f.booking_status,
        date:formatedDate(f.instance_id?.date),
        price:f.total_price,
        details:f.flight_number,
        username:f.user_id.name
    }));

        const transformdHotels = hotelBooking.map(h=>({
        bookingId:h._id,
        type:'Hotel',
        title:h.hotelId?.name,
        status:h.status,
        date:`${formatedDate(h.checkInDate)}-->${formatedDate(h.checkOutDate)}`,
        price:h.totalPrice,
        username:h.userId.name
        


    }));

        const transformdPackage = packageBooking.map(p=>({
        bookingId:p._id,
        type:'Package',
        title:p.package_id.destination,
        status:p.booking_status,
        date:`${formatedDate(p.package_id.start_date)}-->${formatedDate(p.package_id.end_date)}`,
        price:p.total_price,
        username:p.user_id.name
        


    }));

    const allBookings = [
        ...transformdFlight,
        ...transformdHotels,
        ...transformdPackage
    ].sort((a,b)=>new Date(b.date)-new Date(a.date));

    res.status(200).json(
        new ApiResponse(200,"allBookings fetch successfully",{allBookings},true)
    )


});

export const getAllAdminDashData = asyncHandler(async(req,res)=>{

    const currentYear = parseInt(req.query.year) || new Date().getFullYear();
    const currentMonth = parseInt(req.query.month) || (new Date().getMonth() + 1); 
    const startOfMonth = new Date(Date.UTC(currentYear, currentMonth - 1, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999));

    const[flightData,hotelData,tourData,userData] = await Promise.all([

        flightBookingModel.aggregate([
            {
                $facet:{
                    revenue:[{$group:{_id:null,total:{$sum:'$total_price'},count:{$sum:1}}}],
                    graph:[
                        {$match:{booked_at:{$gte:startOfMonth,$lte:endOfMonth}}},
                        {$group:{_id:{$dayOfMonth:'$booked_at'},count:{$sum:1},revenue:{$sum:'total_price'}}}
                    ]
                }
            }
        ]),

        BookingModel.aggregate([
        {
          $facet: {
            revenue: [{ $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } }],
            graph: [
              { $match: { createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
              { $group: { _id: { $dayOfMonth: '$createdAt' }, count: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } }
            ]
          }
        }
      ]),

      Booking.aggregate([
        {
          $facet: {
            revenue: [{ $group: { _id: null, total: { $sum: '$total_price' }, count: { $sum: 1 } } }],
            graph: [
              { $match: { createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
              { $group: { _id: { $dayOfMonth: '$createdAt' }, count: { $sum: 1 }, revenue: { $sum: '$total_price' } } }
            ]
          }
        }
      ]),
      UserModel.countDocuments({})
    ]);

    const flights ={
        revenue:flightData[0]?.revenue[0]?.total || 0,
        count: flightData[0]?.revenue[0]?.count || 0,
        graph: flightData[0]?.graph || []
    }
    const hotels = {
      revenue: hotelData[0]?.revenue[0]?.total || 0,
      count: hotelData[0]?.revenue[0]?.count || 0,
      graph: hotelData[0]?.graph || []
    };

    const tours = {
      revenue: tourData[0]?.revenue[0]?.total || 0,
      count: tourData[0]?.revenue[0]?.count || 0,
      graph: tourData[0]?.graph || []
    };

    const totalRevenue = flights.revenue + hotels.revenue + tours.revenue;
    const totalBookings = flights.count + hotels.count + tours.count;

    const dailyGraphMap = {};
    
    const mergeToGraphMap = (graphArray) => {
      graphArray.forEach(item => {
        const day = item._id;
        if (!dailyGraphMap[day]) {
          dailyGraphMap[day] = { day, bookings: 0, revenue: 0 };
        }
        dailyGraphMap[day].bookings += item.count;
        dailyGraphMap[day].revenue += item.revenue;
      });
    };

    mergeToGraphMap(flights.graph);
    mergeToGraphMap(hotels.graph);
    mergeToGraphMap(tours.graph);

    const monthlyGraphData = Object.values(dailyGraphMap).sort((a, b) => a.day - b.day);

    return res.status(200).json(
        new ApiResponse(200,"data fetched ",{totalRevenue,totalBookings,userData,department:{flights: flights.revenue,hotels: hotels.revenue,tours: tours.revenue},monthlyGraph: monthlyGraphData},true)
    )
});


function formatedDate(fdate){
    const p = new Date(fdate);
    return `${p.getDate()}-${p.getMonth()+1}-${p.getFullYear()}`;

}


