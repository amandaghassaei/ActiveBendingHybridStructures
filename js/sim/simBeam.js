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

SimBeam.prototype.getInnerNodes = function(){
    var nodes = [];
    for (var i=0;i<this.edges.length;i++){
        nodes = nodes.concat(this.edges[i].getInnerNodes());
    }
    return nodes;
};

SimBeam.prototype.getNumNodes = function(){
    var _numNodes = 0;
    for (var i=0;i<this.edges.length;i++){
        _numNodes += this.edges[i].getNumNodes();
    }
    return _numNodes;
};

SimBeam.prototype.getElements = function(){
    var elements = [];
    for (var i=0;i<this.edges.length;i++){
        elements = elements.concat(this.edges[i].getElements());
    }
    return elements;
};

SimBeam.prototype.getNumElements = function(){
    var _numElements = 0;
    for (var i=0;i<this.edges.length;i++){
        _numElements += this.edges[i].getNumElements();
    }
    return _numElements;
};


SimBeam.prototype.setMaterial = function(material){
    _.each(this.edges, function(edge){
        edge.setMaterial(material);
    });
};

SimBeam.prototype.reset = function(){
    for (var i=0;i<this.edges.length;i++){
        this.edges[i].reset();
    }
};

SimBeam.prototype.setSimIndex = function(index){
    for (var i=0;i<this.edges.length;i++){
        this.edges[i].setSimBeamIndex(index);
    }
};

SimBeam.prototype.destroy = function(){
    _.each(this.edges, function(edge){
        edge.destroy();
    });
    this.edges = [];
};