const mongoose = require('mongoose');

// ------------------------------------------------------------------------------
// Schema definition for the cluster collection
// ------------------------------------------------------------------------------
const clusterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    q_cartesian: {
        type: Number,
        required: true
    },
    r_cartesian: {
        type: Number,
        required: true
    },
}, { versionKey: false });

clusterSchema.methods.getAllNeighbors = function () {
    return mongoose.model('Cluster').find({
        $or: [
            { q_cartesian: this.q_cartesian, r_cartesian: this.r_cartesian - 1 },
            { q_cartesian: this.q_cartesian + 1, r_cartesian: this.r_cartesian - 1 },
            { q_cartesian: this.q_cartesian + 1, r_cartesian: this.r_cartesian },
            { q_cartesian: this.q_cartesian, r_cartesian: this.r_cartesian + 1 },
            { q_cartesian: this.q_cartesian - 1, r_cartesian: this.r_cartesian + 1 },
            { q_cartesian: this.q_cartesian - 1, r_cartesian: this.r_cartesian },
        ]
    })
}

// coordinate must be unique
clusterSchema.index({ q_cartesian: 1, r_cartesian: 1 }, { unique: true });

const Cluster = mongoose.model('Cluster', clusterSchema);

exports.Cluster = Cluster;