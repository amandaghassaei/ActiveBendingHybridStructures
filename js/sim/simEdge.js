/**
 * Created by ghassaei on 11/4/16.
 */


function SimEdge(nodes, parent){
    this.elements = [];
    this.innerNodes = [];
    this.nodes = nodes;
    this.parent = parent;
    this.object3D = new THREE.Object3D();
    parent.add(this.object3D);

}

SimEdge.prototype.getOtherNode = function(node){
    if (this.nodes[0] === node) return this.nodes[1];
    return this.nodes[0];
};

SimEdge.prototype.getInnerNodes = function(node0){
    if (this.nodes[0] != node0) return this.innerNodes;
    var innerNodes = this.innerNodes.slice();
    return innerNodes.reverse();
};

SimEdge.prototype.getLength = function(){
    return this.getVector().length();
};

SimEdge.prototype.getNodes = function(){
    return this.nodes;
};

SimEdge.prototype.getVector = function(){
    return this.nodes[0].getPosition().sub(this.nodes[1].getPosition());
};

SimEdge.prototype.getNumElements = function(elementLength){
    var length = this.getLength();
    return Math.round(length/elementLength);
};

SimEdge.prototype.mesh = function(elementLength, numElements){
    this.destroyElements();
    var length = this.getLength();
    if (numElements === undefined) numElements = this.getNumElements(elementLength);
    var numNodes = numElements - 1;
    var vector = this.getVector().normalize();
    var lastNode = this.nodes[0];
    var edge = new SimBeamEl([lastNode, this.nodes[1]], this.object3D);
    this.elements.push(edge);
    for (var i=0;i<numNodes;i++){
        var node = new SimNode(vector.clone().multiplyScalar((i+1)/(numElements)*length).add(this.nodes[1].getPosition()), this.object3D);
        node.setIsBeamNode(true);
        this.innerNodes.push(node);
        var edge = new SimBeamEl([lastNode, node], this.object3D);
        this.elements.push(edge);
        lastNode = node;
    }
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

SimEdge.prototype.destroy = function(){
    this.destroyElements();
    this.elements = null;
    this.nodes = null;
    this.parent.remove(this.object3D);
    this.object3D = null;
    this.parent = null;
};