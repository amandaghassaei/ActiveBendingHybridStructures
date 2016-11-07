/**
 * Created by ghassaei on 11/4/16.
 */


function SimBeam(edges){
    this.edges = edges;
}

SimBeam.prototype.mesh = function(beamElSize, numElements){
    for (var i=0;i<this.edges.length;i++){
        this.edges[i].mesh(beamElSize, numElements);
    }
};

SimBeam.prototype.setupMatrices = function(){
    //nodes, tensionEdges, fixed, externalForces
};

SimBeam.prototype.step = function(){

};

SimBeam.prototype.setMaterial = function(material){
    _.each(this.edges, function(edge){
        edge.setMaterial(material);
    });
};

SimBeam.prototype.destroy = function(){
    _.each(this.edges, function(edge){
        edge.destroy();
    });
    this.edges = [];
};