const TransporterCurrentRequestModel = require('../models/transporterCurrentRequestModel');
const RawMaterialCurrentRequestModel = require('../models/rawMaterialCurrentRequestModel');
const { createRawMaterialPreviousRequest } = require('./rowMaterialPreviousRequestService');
const GoodsManufacturersCurrentRequestModel = require('../models/goodsManufacturersCurrentRequestModel');
const GoodsDistributorsCurrentRequestModel = require('../models/goodsDistributorsCurrentRequestModel');

const asyncHandler = require('express-async-handler')

// @desc Get list of Transporter Current Request for a transporter
// @route GET /api/v1/transportCurrentRequest
// @access Public
exports.getTransporterCurrentRequest = asyncHandler(async (req, res) => {

    const userType = req.user.userType;
    const userId = req.user._id;

    let filter;
    if (userType === 'transporter') {
        filter = { transporterId: userId };
    } else {
        return res.status(403).json({ msg: 'Access denied: Only transporters can access their requests.' });
    }

    try {
        const transporterCurrentRequests = await TransporterCurrentRequestModel.find(filter);
        res.status(200).json({ data: transporterCurrentRequests });
    } catch (error) {
        res.status(500).json({ msg: 'Error retrieving requests', error: error.message });
    }

});

// @desc Create Transporter Current Request 
// @route POST /api/v1/transportCurrentRequest
// @access Public
exports.createTransporterCurrentRequest = asyncHandler(async (req, res) => {

    const userId = req.user._id; // senderId
    const userType = req.user.userType; // sender_type
    const request_id = req.body.request_id;
    const receiver_id = req.body.receiver_id;
    const receiver_type = req.body.receiver_type;
    const transporterId = req.body.transporterId;
    const transporterName = req.body.transporterName;
    const temperature = req.body.temperature;
    const weight = req.body.weight;
    const distance = req.body.distance;
    const totalPrice = req.body.totalPrice;
    const estimated_delivery_date = req.body.estimated_delivery_date;
    const actual_delivery_date = req.body.actual_delivery_date || null;
    const status = req.body.status || 'pending';
    const arrivalAddress = req.body.arrivalAddress;
    const departureAddress = req.body.departureAddress;
    const tracking_number = req.body.tracking_number || '';
    const contract_id = req.body.contract_id || '';

    if (!['supplier', 'manufacturer', 'distributor'].includes(userType)) {
        return res.status(403).json({ msg: 'Access denied: Only suppliers, manufacturers, and distributors can create transport requests.' });
    }

    try {
        const TransporterCurrentRequest = await TransporterCurrentRequestModel.create({
            request_id,
            senderId: userId,
            sender_type: userType,
            receiver_id,
            receiver_type,
            transporterId,
            transporterName,
            temperature,
            weight,
            distance,
            totalPrice,
            estimated_delivery_date,
            actual_delivery_date,
            status,
            arrivalAddress,
            departureAddress,
            tracking_number,
            contract_id,
        });

        res.status(201).json({ data: TransporterCurrentRequest });
    } catch (error) {
        return res.status(400).json({ msg: 'Validation Error', errors: error.errors });
    }

});

// @desc Get Specific Transporter Request by ID for authorized Transporter
// @route GET /api/v1/transportCurrentRequest/:id
// @access Public
exports.getTransporterCurrentRequestById = asyncHandler(async (req, res) => {
    const { id } = req.params; // take id from / :id
    const userType = req.user.userType;
    const userId = req.user._id;

    // Check if ID is empty
    if (!id || id.trim() === '') {
        return res.status(400).json({ msg: 'ID is required.' });
    }

    // Check that the short ID matches the specified pattern.
    const shortIdPattern = /^t[0-9a-z]{8}$/; // Regex for t followed by 8 characters (numbers or lowercase letters)

    // Check that the ID is 9 characters long.
    if (id.length !== 9 || !shortIdPattern.test(id)) {
        return res.status(400).json({ msg: `Invalid shortId format: ${id}` });
    }

    // Search using shortId
    const request = await TransporterCurrentRequestModel.findOne({ shortId: id });

    // Check if the request is null or undefined
    if (!request) {
        return res.status(404).json({ msg: `There is no Request for this id: ${id}` });
    }

    // Check if the user has access to this request
    const hasAccess = userType === 'transporter' && request.transporterId.toString() === userId.toString();

    if (!hasAccess) {
        return res.status(401).json({ msg: 'You do not have permission to access this request.' });
    }

    res.status(200).json({ data: request });
});

// @desc Update Specific Transport Request Status by Transporter
// @route PUT /api/v1/transportCurrentRequest/:id
// @access Private
exports.updateTransporterCurrentRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id; // Get the user ID
    const userType = req.user.userType; // Get user type (should be transporter)
    const { status } = req.body; // Get the new status from request body

    // Check if the user is a transporter
    if (userType !== 'transporter') {
        return res.status(403).json({ msg: 'Only transporters can update the request status.' });
    }

    // Find the transport request to check if it is assigned to the transporter
    const request = await TransporterCurrentRequestModel.findOne({ shortId: id });

    // Check if the request exists
    if (!request) {
        return res.status(404).json({ msg: `There is no Request for this id: ${id}` });
    }

    // Verify that the transporter assigned to this request matches the current user
    if (request.transporterId.toString() !== userId.toString()) {
        return res.status(403).json({ msg: 'You do not have permission to access this request.' });
    }

    // Determine the new status of the other party based on the order status updated by the transporter
    let relatedStatus;
    switch (status) {
        case 'accepted':
            relatedStatus = 'inProgress';
            break;
        case 'rejected':
            relatedStatus = 'pending';
            break;
        case 'delivered':
            relatedStatus = 'delivered';
            break;
        default:
            return res.status(400).json({ msg: 'Invalid status for update.' });
    }

    // Call the function to update the status of the sender and check if successful
    const isSenderUpdated = await updateSenderStatus(request, relatedStatus);

    if (!isSenderUpdated) {
        return res.status(500).json({ msg: 'Failed to update sender status.' });
    }

    const updateStatus = { status };
    // if the status is 'delivered' and actual date is not set, add the current date
    if (status === 'delivered' && !request.actual_delivery_date) {
        updateStatus.actual_delivery_date = new Date();
    }

    // Update the status of the transport request
    const updatedRequest = await TransporterCurrentRequestModel.findOneAndUpdate(
        { shortId: id }, // identifier to find the request
        updateStatus, // the data to update
        { new: true } // to return the updated data
    );
    // Send the updated request as response
    res.status(200).json({ data: updatedRequest });
});

// Function to update the status of the sender (supplier, manufacturer, distributor)
async function updateSenderStatus(request, status) {

    let currentModel;
    let methodCreate;
    switch (request.sender_type) {
        case 'supplier':
            currentModel = RawMaterialCurrentRequestModel;
            methodCreate = createRawMaterialPreviousRequest;
            break;
        case 'manufacturer':
            currentModel = GoodsManufacturersCurrentRequestModel;
            break;
        case 'distributor':
            currentModel = GoodsDistributorsCurrentRequestModel;
            break;
        default:
            throw new Error('Unknown sender type.');
    }



    let result;
    if (status === 'inProgress') {
        result = await currentModel.updateMany(
            { shortId: request.request_id },
            {
                status: status,
                departureAddress: request.departureAddress,
                transporterId: request.transporterId,
                transporterName: request.transporterName,
                estimated_delivery_date: request.estimated_delivery_date,
                transportRequest_id: request.shortId,
            }
        );
    } else if (status === 'pending') {
        result = await currentModel.updateMany(
            { shortId: request.request_id },
            { status: status }
        );
    } else if (status === 'delivered') {
        //1) update statuse
        result = await currentModel.findOneAndUpdate(
            { shortId: request.request_id },
            {
                status: status,
                actual_delivery_date: request.actual_delivery_date || new Date()
            },
            { new: true }
        );
    }

    if (!result) {
        throw new Error('Failed to update status in sender model');
    }

    // Return true if the update was successful, otherwise false
    return !!result;
}

// @desc Delete Specific Transport Request by Transporter
// @route DELETE /api/v1/transportCurrentRequest/:id
// @access Private
exports.deleteTransporterCurrentRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id; // Get user ID
    const userType = req.user.userType; // Get user type (transporter)

    // Find the request to check if it is related to the user
    const request = await TransporterCurrentRequestModel.findOne({ shortId: id });

    //check if the request is null or undefined
    if (!request) {
        return res.status(404).json({ msg: `There is no Request for this id: ${id}` });
    }

    if (userType === 'transporter' && request.transporterId.toString() !== userId.toString()) {
        return res.status(403).json({ msg: 'Access denied: You do not have permission to delete this request.' });
    }
    //Delete request
    await TransporterCurrentRequestModel.findOneAndDelete({ shortId: id });

    res.status(204).send();
});
