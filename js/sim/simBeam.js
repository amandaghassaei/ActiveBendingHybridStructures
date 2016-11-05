/**
 * Created by ghassaei on 11/4/16.
 */


function SimBeam(edges){
    this.edges = edges;
}

SimBeam.prototype.mesh = function(beamElSize){
    for (var i=0;i<this.edges.length;i++){
        this.edges[i].mesh(beamElSize);
    }
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