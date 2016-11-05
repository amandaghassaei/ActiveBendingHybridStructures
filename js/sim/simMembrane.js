/**
 * Created by ghassaei on 11/4/16.
 */


function SimMembrane(simEdges, simNodes, parent){
    this.object3D = new THREE.Object3D();
    parent.add(this.object3D);
    this.parent = parent;
    this.simEdges = simEdges;
    this.simNodes = simNodes;
    this.innerNodes = [];
    this.innerEdges = [];
    this.borderNodes = [];
}

SimMembrane.prototype.setBorderNodes = function(){
    var simNodes = this.simNodes;
    var borderNodes = [simNodes[0]];
    for (var i=0;i<this.simEdges.length;i++){
        var lastNode = borderNodes[borderNodes.length-1];
        var edge = this.simEdges[i];
        var edgeNodes = edge.getInnerNodes(lastNode);
        for (var j=0;j<edgeNodes.length;j++){
            borderNodes.push(edgeNodes[j]);
        }
        borderNodes.push(edge.getOtherNode(lastNode));
    }
    borderNodes.pop();
    this.borderNodes =  borderNodes;
};

SimMembrane.prototype.mesh = function(numLayers){
    this.destroyInnerNodes();
    var node, edge;
    var lastLayer = this.borderNodes;
    var centerPosition = new THREE.Vector3(0,0,0);
    for (var i=0;i<this.borderNodes.length;i++){
        centerPosition.add(this.borderNodes[i].getPosition());
    }
    centerPosition.multiplyScalar(1/this.borderNodes.length);
    for (var j=0;j<numLayers;j++){
        var nextLayer = [];
        for (var i=0;i<this.borderNodes.length;i++){
            node = new SimNode(centerPosition.clone(), this.object3D);
            nextLayer.push(node);
            this.innerNodes.push(node);
            if (i>0) {
                edge = new SimTensionEl([node, nextLayer[nextLayer.length-1]], this, this.object3D);
                this.innerEdges.push(edge);
            }
            edge = new SimTensionEl([node, lastLayer[i]], this, this.object3D);
            this.innerEdges.push(edge);
        }
        edge = new SimTensionEl([node, nextLayer[0]], this, this.object3D);
        this.innerEdges.push(edge);
        lastLayer = nextLayer;
    }
    node = new SimNode(centerPosition.clone(), this.object3D);
    nextLayer.push(node);
    for (var i=0;i<lastLayer.length;i++){
        edge = new SimTensionEl([node, lastLayer[i]], this, this.object3D);
        this.innerEdges.push(edge);
    }
};

SimMembrane.prototype.destroyInnerNodes = function(){
    this.object3D.children = [];
    for (var i=0;i<this.innerNodes.length;i++){
        this.innerNodes[i].destroy();
    }
    this.innerNodes = [];
    this.innerEdges = [];
};

SimMembrane.prototype.setNumLayers = function(numLayers){
    this.mesh(numLayers);
};

SimMembrane.prototype.destroy = function(){
    this.parent = null;
    this.destroyInnerNodes();
    this.object3D = null;
    this.simEdges = null;
    this.simNodes = null;
    this.borderNodes = null;
};