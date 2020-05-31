const { Cluster } = require('../models/cluster');

class ClusterProcessor {
    constructor() {

    }

    async addCluster(name, q_cartesian, r_cartesian) {
        var newCluster = new Cluster({
            name,
            q_cartesian,
            r_cartesian
        })
        try {
            var savedCluster = await newCluster.save();
        } catch (error) {
            throw new Error(error);
        }
        console.log(savedCluster);
        console.log(newCluster);
        return savedCluster;
    }

    findClusterByName(clusterName) {        
        return Cluster
            .findOne({ name: clusterName })
            .exec();
    }

    findClusterByCartesian(q_cartesian, r_cartesian) {
        return Cluster
            .findOne({ q_cartesian: q_cartesian, r_cartesian: r_cartesian })
            .exec();
    }

    deleteClusterByName(clusterName) {
        return Cluster
            .findOneAndDelete({ name: clusterName });
    }

    getTotalClusterCount() {
        return Cluster.countDocuments({}).exec();
    }

    getAllClusters() {
        return Cluster.find({}).exec();
    }
}

exports.clusterProcessor = new ClusterProcessor();