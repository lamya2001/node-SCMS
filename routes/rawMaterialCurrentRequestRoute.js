const express = require('express');//import the express library

const { getRawMaterialCurrentRequests,
    createRawMaterialCurrentRequest,
    getRawMaterialCurrentRequestById,
    getRawMaterialCurrentRequestByMSlug,
    updateRawMaterialCurrentRequest,
    deleteRawMaterialCurrentRequest,
    getRawMaterialCurrentRequestByMName
} = require('../services/rowMaterialCurrentRequestService');


const router = express.Router();

//Routes
router.route('/').get(getRawMaterialCurrentRequests).post(createRawMaterialCurrentRequest);
router.route('/:id').get(getRawMaterialCurrentRequestById).put(updateRawMaterialCurrentRequest).delete(deleteRawMaterialCurrentRequest); // Define a special path for ObjectId
router.route('/manufacturer/slug/:slug').get(getRawMaterialCurrentRequestByMSlug); // Path to search for manufacturer slug
router.route('/manufacturerName/:manufacturerName').get(getRawMaterialCurrentRequestByMName);

module.exports = router;