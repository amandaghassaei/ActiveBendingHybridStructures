/**
 * Created by ghassaei on 11/4/16.
 */


function SimEdge(nodes, parent){
    this.elements = [];
    this.innerNodes = [];
    this.nodes = nodes;
    this.parent = parent;
}

SimEdge.prototype.getOtherNode = function(node){
    if (this.nodes[0] === node) return this.nodes[1];
    return this.nodes[0];
};

SimEdge.prototype.getInnerNodes = function(node0){
    if (this.nodes[0] === node0) return this.innerNodes;
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

SimEdge.prototype.mesh = function(elementLength){
    this.destroyElements();
    var length = this.getLength();
    var numElements = Math.round(length/elementLength);
    var numNodes = numElements - 1;
    var vector = this.getVector().normalize();
    var lastNode = this.nodes[0];
    for (var i=0;i<numNodes;i++){
        var node = new Node(vector.clone().multiplyScalar(i/(numNodes+1)*length), this.parent);
        this.innerNodes.push(node);
        var edge = new Edge([lastNode, node], this.parent);
        this.elements.push(edge);
        lastNode = node;
    }
    var edge = new Edge([lastNode, this.nodes[1]], this.parent);
    this.elements.push(edge);
};

SimEdge.prototype.destroyElements = function(){
    for (var i=0;i<this.elements.length;i++){
        this.elements[i].destroy();
    }
    this.elements = [];
    for (var i=0;i<this.innerNodes.length;i++){
        this.innerNodes[i].destroy();
    }
    this.innerNodes = [];
};

SimEdge.prototype.destroy = function(){
    this.destroyElements();
    this.elements = null;
    this.nodes = null;
};