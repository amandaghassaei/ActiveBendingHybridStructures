/**
 * Created by ghassaei on 11/4/16.
 */


function SimMembrane(parent){
    this.object3D = new THREE.Object3D();
    parent.add(this.object3D);
    this.parent = parent;
    this.innerNodes = [];
    this.edges = [];
}

SimMembrane.prototype.setBorderNodes = function(borderNodes, numLayers){
    this.borderNodes =  borderNodes;
    this.recalcNodeAndEdges(numLayers);
};

SimMembrane.prototype.recalcNodeAndEdges = function(numLayers){
    this.destroyInnerNodes();
    var node, edge;
    var lastLayer = this.borderNodes;
    for (var j=0;j<numLayers;j++){
        var nextLayer = [];
        for (var i=0;i<borderNodes.length;i++){
            node = new SimNode(new THREE.Vector3(), this.object3D);
            nextLayer.push(node);
            this.innerNodes.push(node);
            if (i>0) {
                edge = new SimTensionEl([node, nextLayer[nextLayer.length-1]], this, this.object3D);
                this.edges.push(edge);
            }
            edge = new SimTensionEl([node, lastLayer[i]], this, this.object3D);
            this.edges.push(edge);
        }
        edge = new SimTensionEl([node, nextLayer[0]], this, this.object3D);
        this.edges.push(edge);
        lastLayer = nextLayer;
    }
};

SimMembrane.prototype.destroyInnerNodes = function(){
    for (var i=0;i<this.innerNodes.length;i++){
        this.innerNodes[i].destroy();
    }
    this.innerNodes = null;
    this.edges = [];
};

SimMembrane.prototype.setNumLayers = function(numLayers){
    this.recalcNodeAndEdges(numLayers);
};

SimMembrane.prototype.destroy = function(){
    this.parent.remove(this.object3D);
    this.parent = null;
    this.object3D = null;
    this.destroyInnerNodes();
    this.borderNodes = null;
};