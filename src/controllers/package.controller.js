import { Package } from '../models/package.model.js';
import ApiError from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const addPackage = asyncHandler(async (req, res) => {

  const newPackage = new Package({
    ...req.body,
    user_id: req.user.user_id
  });

  //const savedPackage = await newPackage.save();
  await newPackage.save();
  const savedPackage = await Package.findOne(Package._id).populate("user_id").lean();

  res.status(201).json(new ApiResponse(200, "Package created!", savedPackage, true));
});



export const getAllPManPackages = asyncHandler(async (req, res) => {
  const user_id = req.user.user_id;
  const packages = await Package.find({ user_id:user_id })
    .populate('user_id', 'name email');
  res.status(200).json(new ApiResponse(200, "All Packages found", packages, true));
});





export const updatePackage = asyncHandler(async (req, res) => {

  const updatedPackage = await Package.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { returnDocument: 'after', runValidators: true }
  );

  if (!updatedPackage) {
    //return res.status(404).json({ message: "Package not found" });
    throw new ApiError(404, "Package not found");
  }
  //res.status(200).json(updatedPackage);
  res.status(200).json(new ApiResponse(200, "Package Updated!", updatedPackage, true))
})


