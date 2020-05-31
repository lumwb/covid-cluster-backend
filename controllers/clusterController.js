const { clusterProcessor } = require('../processors/clusterProceessor');

class ClusterController {
    constructor() {
    }

    async getNeighbors(req, res) {
        var requestedClusterName = req.query.clusterName;

        console.log(requestedClusterName);

        // validate cluster name requested exists
        try {
            var targetCluster = await clusterProcessor.findClusterByName(requestedClusterName);
        } catch (error) {
            console.log(error);
        }
        if (!targetCluster) {
            return res.status(500).send({
                "error": "Cannot find cluster name",
                "clusterName": requestedClusterName
            })
        }

        try {
            var allNeighbors = await targetCluster.getAllNeighbors().exec();
        } catch (error) {
            return res.status(500).send({
                "error": "Unexpected error finding neighbors of cluster",
                "clusterName": requestedClusterName
            })
        }

        return res.send({
            "neighbors": prettifyRelativeIndex(targetCluster, allNeighbors)
        })
    }

    async addCluster(req, res) {
        var baseClusterName = req.body.baseClusterName;
        var baseClusterSide = req.body.baseClusterSide;
        var newClusterName = req.body.newClusterName;

        // validate that baseClusterSide is valid
        if (!(0 <= baseClusterSide <= 5)) {
            return res.status(500).send({
                "error": "invalid cluster side. Please provide number in range 0-5"
            });
        }

        // validate cluster name requested exists
        try {
            var baseCluster = await clusterProcessor.findClusterByName(baseClusterName);
        } catch (error) {
            console.log(error);
        }
        if (!baseCluster) {
            return res.status(500).send({
                "error": "Cannot find base cluster name",
                "clusterName": baseClusterName
            })
        }

        // calculate coordinate of newCluster
        var newClusterCartesian = getNeighborCoordinateByIndex(baseCluster.q_cartesian, baseCluster.r_cartesian, baseClusterSide);

        try {
            var saveNewCluster = await clusterProcessor.addCluster(newClusterName, newClusterCartesian[0], newClusterCartesian[1]);
        } catch (error) {
            console.log(error);
            return res.status(500).send({
                "error": "Unexpected error saving new cluster."
            })
        }

        return res.send({
            newCluster: saveNewCluster
        })
    }

    async deleteCluster(req, res) {
        var targetClusterName = req.body.clusterName;
        // validate cluster name requested exists
        try {
            var targetCluster = await clusterProcessor.findClusterByName(targetClusterName);
        } catch (error) {
            console.log(error);
        }
        if (!targetCluster) {
            console.log("cannot find target cluster");
            return res.status(500).send({
                "error": "Cannot find target cluster",
                "clusterName": targetCluster
            })
        }

        // get all neighbors to choose root node for DFS later
        try {
            var targetClusterNeighbors = await targetCluster.getAllNeighbors().exec();
            console.log("got target neibhros");
            console.log(targetClusterNeighbors);
        } catch (error) {
            console.log(error);
        }

        var dfsRootCluster = targetClusterNeighbors[0];

        // remove targetClsuter
        try {
            var deleteCluster = await clusterProcessor.deleteClusterByName(targetClusterName);
            console.log("Succesfully deleted clsuter for now");
        } catch (error) {
            console.log(error);
            return res.status(500).send({
                "error": "Unexpected error deleting target cluster",
                "targetCluster": targetCluster
            })
        }
        // get total amount of clusters
        try {
            var totalClusterCount = await clusterProcessor.getTotalClusterCount();
        } catch (error) {
            console.log(error);
        }

        // there are no more hexagons in graph
        if (totalClusterCount == 0) {
            return res.send({
                targetCluster: targetCluster
            });
        }

        // check connectedness
        try {
            var isConnected = await validateConnectedBFS(dfsRootCluster, totalClusterCount);
        } catch (error) {
            console.log(error);
        }

        if (!isConnected) {
            // deleting this node breaks the graph
            // revert changes
            try {
                var restoreDeletedCluster = await clusterProcessor.addCluster(targetCluster.name, targetCluster.q_cartesian, targetCluster.r_cartesian);
            } catch (error) {
                console.log(error);
                return res.status(500).send({
                    "error": "Unexpected error restoring deleted node"
                })
            }
            return res.status(500).send({
                "error": "Deleting this node will cause a disconnect"
            })
        }

        return res.send({
            targetCluster: targetCluster
        })
    }

    async getAllClusters(req, res) {
        try {
            var allCluster = await clusterProcessor.getAllClusters();
        } catch (error) {
            return res.status(500).send({
                "error": "Unexpected error getting all clusters"
            })
        }

        return res.send({
            allCluster
        })
    }

    async initFirstCluster(req, res) {
        var baseClusterName = req.body.baseClusterName;
        var baseClusterSide = req.body.baseClusterSide;
        var newClusterName = req.body.newClusterName;

        // validate that baseClusterSide is valid
        if (!(0 <= baseClusterSide <= 5)) {
            return res.status(500).send({
                "error": "invalid cluster side. Please provide number in range 0-5"
            });
        }

        try {
            var saveNewCluster = await clusterProcessor.addCluster(newClusterName, 0, 0);
        } catch (error) {
            console.log(error);
            return res.status(500).send({
                "error": "Unexpected error saving new cluster."
            })
        }

        return res.send({
            newCluster: saveNewCluster
        })
    }
}

async function validateConnectedBFS(cluster, totalClusterCount) {
    function Queue() { var a = [], b = 0; this.getLength = function () { return a.length - b }; this.isEmpty = function () { return 0 == a.length }; this.enqueue = function (b) { a.push(b) }; this.dequeue = function () { if (0 != a.length) { var c = a[b]; 2 * ++b >= a.length && (a = a.slice(b), b = 0); return c } }; this.peek = function () { return 0 < a.length ? a[b] : void 0 } };

    // Create a Queue and add our initial node in it
    let q = new Queue();
    let explored = new Set();
    q.enqueue(cluster);

    console.log(totalClusterCount);

    // Mark the first node as explored explored.
    explored.add(cluster._id.toString());

    // We'll continue till our queue gets empty
    while (!q.isEmpty()) {
        let tempCluster = q.dequeue();
        console.log("BFS working on " + tempCluster);

        try {
            var tempClusterNeighbors = await tempCluster.getAllNeighbors().exec();
            console.log(tempClusterNeighbors);
        } catch (error) {
            return res.status(500).send({ "Error": "Unexpected error getting neighbors" })
        }


        tempClusterNeighbors
            .filter(n => !explored.has(n._id.toString()))
            .forEach(n => {
                explored.add(n._id.toString());
                q.enqueue(n);
            });
    }
    return explored.size == totalClusterCount;
}

function prettifyRelativeIndex(targetCluster, allNeighbors) {
    var result = [];
    var allPossibleNeighborCoordiate = getAllNeighborCoordinate(targetCluster);
    var x;
    for (x = 0; x < allNeighbors.length; x++) {
        var currentCluster = allNeighbors[x];
        var i;
        for (i = 0; i < allPossibleNeighborCoordiate.length; i++) {
            if (allPossibleNeighborCoordiate[i][0] == currentCluster.q_cartesian &&
                allPossibleNeighborCoordiate[i][1] == currentCluster.r_cartesian) {
                result.push({
                    index: i,
                    cluster: currentCluster
                })
            }
        }
    }
    return result;
}

function getNeighborCoordinateByIndex(q_cartesian, r_cartesian, index) {
    if (index == 0) {
        return [q_cartesian, r_cartesian - 1];
    } else if (index == 1) {
        return [q_cartesian + 1, r_cartesian - 1];
    } else if (index == 2) {
        return [q_cartesian + 1, r_cartesian];
    } else if (index == 3) {
        return [q_cartesian, r_cartesian + 1];
    } else if (index == 4) {
        return [q_cartesian - 1, r_cartesian + 1];
    } else if (index == 5) {
        return [q_cartesian - 1, r_cartesian];
    } else {
        // unexpected error
        throw new Error("Neighbour index out of bound");
    }
}

function getAllNeighborCoordinate(cluster) {
    var result = [];
    var i;
    for (i = 0; i < 6; i++) {
        result.push(getNeighborCoordinateByIndex(cluster.q_cartesian, cluster.r_cartesian, i));
    }
    return result;
}

async function getAllValidNeighbors(cluster) {
    var allValidNeighbors = [];
    var allPossibleNeighborCoordiate = getAllNeighborCoordinate(cluster);
    var i;
    for (i = 0; i < allPossibleNeighborCoordiate.length; i++) {
        try {
            var validNeighbor = await clusterProcessor
                .findClusterByCartesian(allPossibleNeighborCoordiate[i][0], allPossibleNeighborCoordiate[i][1]);
        } catch (error) {
            console.log(error);
        }

        if (validNeighbor) {
            allValidNeighbors.push(validNeighbor);
        }
    }
    return allValidNeighbors;
}

exports.clusterController = new ClusterController();