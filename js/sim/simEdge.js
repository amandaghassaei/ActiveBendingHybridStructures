/**
 * Created by ghassaei on 11/4/16.
 */


function SimEdge(nodes, length, parent){
    this.elements = [];
    this.innerNodes = [];
    this.nodes = nodes;
    this.parent = parent;
    this.object3D = new THREE.Object3D();
    this.length = length;
    parent.add(this.object3D);

}

SimEdge.prototype.getOtherNode = function(node){
    if (this.nodes[0] === node) return this.nodes[1];
    return this.nodes[0];
};

SimEdge.prototype.getInnerNodes = function(node0){
    if (node0 === undefined) return this.innerNodes;
    if (this.nodes[0] != node0) return this.innerNodes;
    var innerNodes = this.innerNodes.slice();
    return innerNodes.reverse();
};

SimEdge.prototype.getElements = function(){
    return this.elements;
};

SimEdge.prototype.getNodes = function(){
    return this.nodes;
};

SimEdge.prototype.getNumNodes = function(){
    return this.innerNodes.length;
};

SimEdge.prototype.getNumElements = function(){
    return this.elements.length;
};

SimEdge.prototype.mesh = function(elementLength, numElements){
    this.destroyElements();
    var vector = this.nodes[0].getOriginalPosition().sub(this.nodes[1].getOriginalPosition());
    var length = vector.length();
    if (numElements === undefined) numElements = Math.round(length/elementLength);
    var numNodes = numElements - 1;
    vector.normalize();
    var lastNode = this.nodes[1];
    for (var i=0;i<numNodes;i++){
        var node = new SimNode(vector.clone().multiplyScalar((i+1)/(numElements)*length).add(this.nodes[1].getPosition()), this.object3D);
        node.setIsBeamNode(true);
        this.innerNodes.push(node);
        var edge = new SimBeamEl([lastNode, node], this.object3D, this);
        this.elements.push(edge);
        lastNode = node;
    }
    var edge = new SimBeamEl([lastNode, this.nodes[0]], this.object3D, this);
    this.elements.push(edge);
};

SimEdge.prototype.destroyElements = function(){
    this.object3D.children = [];
    for (var i=0;i<this.elements.length;i++){
        this.elements[i].destroy();
    }
    this.elements = [];
    for (var i=0;i<this.innerNodes.length;i++){
        this.innerNodes[i].destroy();
    }
    this.innerNodes = [];
};

SimEdge.prototype.setMaterial = function(material){
    _.each(this.elements, function(element){
        element.setMaterial(material);
    });
};

SimEdge.prototype.highlight = function(){
    this.setMaterial(edgeMaterialPurple);
};

SimEdge.prototype.reset = function(){
    for (var i=0;i<this.innerNodes.length;i++){
        this.innerNodes[i].reset();
    }
    for (var i=0;i<this.elements.length;i++){
        this.elements[i].update();
    }
};

SimEdge.prototype.getLength = function(){
    return this.length;
};
SimEdge.prototype.setLength = function(length){
    this.length = length;
};

SimEdge.prototype.getElLength = function(){
    return this.length/this.elements.length;
};

SimEdge.prototype.setSimBeamIndex = function(index){
    for (var i=0;i<this.elements.length;i++){
        this.elements[i].setSimBeamIndex(index);
    }
};

SimEdge.prototype.setSimEdgeIndex = function(index){
    for (var i=0;i<this.elements.length;i++){
        this.elements[i].setSimEdgeIndex(index);
    }
};


SimEdge.prototype.destroy = function(){
    this.destroyElements();
    this.elements = null;
    this.innerNodes = null;
    this.nodes = null;
    this.parent.remove(this.object3D);
    this.object3D = null;
    this.parent = null;
};