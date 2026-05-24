import { Package } from '../models/package.model.js';
import ApiError from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Booking } from '../models/package.booking.model.js';
import mongoose from 'mongoose';

export const addPackage = asyncHandler(async (req, res) => {

  const newPackage = new Package({
    ...req.body,
    user_id: req.user.user_id
  });

  //const savedPackage = await newPackage.save();
  await newPackage.save();
  const savedPackage = await Package.findOne(Package._id).populate("user_id").lean();

  res.status(201).json(new ApiResponse(201, "Package created!", savedPackage, true));
});



export const getAllPManPackages = asyncHandler(async (req, res) => {
  const user_id = req.user.user_id;
  const packages = await Package.find({ user_id:user_id })
    .populate('user_id', 'name email');
  res.status(200).json(new ApiResponse(200, "All Packages found", packages, true));
});


export const bookingGuestList = asyncHandler(async(_,res)=>{
  let bookings = await Booking.find({}).populate("user_id", "name phone");
  res.status(201).json(
    new ApiResponse(201, "Guest list received", bookings, true)
  )
})


export const updatePackage = asyncHandler(async (req, res) => {

  const updatedPackage = await Package.findByIdAndUpdate(
    req.query.id,
    { $set: req.body },
    { returnDocument: 'after' }
  );

  if (!updatedPackage) {
    throw new ApiError(404, "Package not found");
  }
  res.status(200).json(new ApiResponse(200, "Package Updated!", updatedPackage, true))
});

export const deletePackage = asyncHandler(async (req, res) => {

  const deletedPackage = await Package.findByIdAndDelete(
    req.query.id
  )
  if (!deletedPackage) {
    throw new ApiError(404, "Package not deleted");
  }
  res.status(200).json(new ApiResponse(200, "Package deleted!", deletedPackage, true))
});


export const getAllPackageDashData = asyncHandler(async(req,res)=>{
  const user_id =req.user.user_id;

    const currentYear = parseInt(req.query.year) || new Date().getFullYear();
    const currentMonth = parseInt(req.query.month) || (new Date().getMonth() + 1); 
    const startOfMonth = new Date(Date.UTC(currentYear, currentMonth - 1, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999));
    const totalDaysInMonth = endOfMonth.getUTCDate();

    const [packageData] = await  Booking.aggregate([

      {
        $match:{PackageUserId:new mongoose.Types.ObjectId(user_id)}
      },
        {
          $facet: {
            revenue: [{ $group: { _id: null, total: { $sum: '$total_price' }, count: { $sum: 1 } } }],
            graph: [
              { $match: { createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
              { $group: { _id: { $dayOfMonth: '$createdAt' }, count: { $sum: 1 }, revenue: { $sum: '$total_price' } } }
            ]
          }
        }
      ]);

    const totalRevenue = packageData?.revenue?.[0]?.total || 0;
    const totalBookings = packageData?.revenue?.[0]?.count || 0;
    const rawGraphArray = packageData?.graph || [];

    const dailyGraphMap = {};
    for (let day = 1; day <= totalDaysInMonth; day++) {
        dailyGraphMap[day] = { day, bookings: 0, revenue: 0 };
    }
    rawGraphArray.forEach(item => {
        const day = item._id;
        if (dailyGraphMap[day]) {
            dailyGraphMap[day].bookings = item.count;
            dailyGraphMap[day].revenue = item.revenue;
        }
    });

    const monthlyGraphData = Object.values(dailyGraphMap).sort((a, b) => a.day - b.day);

    return res.status(200).json(
        new ApiResponse(200,"Dash data fetched ",{totalBookings,totalRevenue,monthlyGraphData},true)
    )
});


