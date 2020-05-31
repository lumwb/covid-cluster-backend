var express = require("express");
var router = express.Router();
// const Honeycomb = require('honeycomb-grid');

var { clusterController } = require('../controllers/clusterController');

router.get("/neighbors", clusterController.getNeighbors);
router.get("/getAllClusters", clusterController.getAllClusters);
router.post("/", clusterController.addCluster);
router.post("/init", clusterController.initFirstCluster);
router.delete("/", clusterController.deleteCluster);

module.exports = router;