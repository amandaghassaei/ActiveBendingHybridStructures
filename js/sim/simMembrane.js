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
    this.innerNodes.push(node);
    for (var i=0;i<lastLayer.length;i++){
        edge = new SimTensionEl([node, lastLayer[i]], this, this.object3D);
        this.innerEdges.push(edge);
    }
    this.setupStaticMatrices();
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

SimMembrane.prototype.setupStaticMatrices = function(){
    var numEdges = this.innerEdges.length;
    var numNodes = this.innerNodes.length;
    var numBorderNodes = this.borderNodes.length;
    var _C = initEmptyArray(numEdges, numNodes);
    var _Cf = initEmptyArray(numEdges, numBorderNodes);
    var _Q = initEmptyArray(numEdges, numEdges);
    var _Xf = initEmptyArray(numBorderNodes);

    for (var i=0;i<numEdges;i++){
        var edge = this.innerEdges[i];
        var _nodes = edge.getNodes();
        if (_nodes[0].isBeamNode) _Cf[i][this.borderNodes.indexOf(_nodes[0])] = 1;
        else _C[i][this.innerNodes.indexOf(_nodes[0])] = 1;
        if (_nodes[1].isBeamNode) _Cf[i][this.borderNodes.indexOf(_nodes[1])] = -1;
        else _C[i][this.innerNodes.indexOf(_nodes[1])] = -1;
        _Q[i][i] = edge.getForceDensity();
    }

    for (var i=0;i<numBorderNodes;i++){
        var position = this.borderNodes[i].getPosition();
        _Xf[i] = [-position.x, -position.y, -position.z];
    }

    this.Ctranspose = numeric.transpose(_C);
    var Ctrans_Q = numeric.dot(this.Ctranspose, _Q);
    var Ctrans_Q_C = numeric.dot(Ctrans_Q, _C);
    this.inv_Ctrans_Q_C = numeric.inv(Ctrans_Q_C);
    this.Ctrans_Q_Cf = numeric.dot(Ctrans_Q, _Cf);
    var Ctrans_Q_Cf_Xf = numeric.dot(this.Ctrans_Q_Cf, _Xf);

    this.solve(Ctrans_Q_Cf_Xf);
};

SimMembrane.prototype.solve = function(Ctrans_Q_Cf_Xf){
    var X = numeric.dot(this.inv_Ctrans_Q_C, Ctrans_Q_Cf_Xf);
    this.render(X);
};

SimMembrane.prototype.render = function(X){
    for (var i=0;i<X.length;i++){
        var nodePosition = new THREE.Vector3(X[i][0],X[i][1],X[i][2]);
        this.innerNodes[i].move(nodePosition);
    }
    for (var i=0;i<this.innerEdges.length;i++){
        this.innerEdges[i].update();
    }
};



SimMembrane.prototype.destroy = function(){
    this.parent = null;
    this.destroyInnerNodes();
    this.object3D = null;
    this.simEdges = null;
    this.simNodes = null;
    this.borderNodes = null;
};

function initEmptyArray(dim1, dim2, dim3){
    if (dim2 === undefined) dim2 = 0;
    if (dim3 === undefined) dim3 = 0;
    var array = [];
    for (var i=0;i<dim1;i++){
        if (dim2 == 0) array.push(0);
        else array.push([]);
        for (var j=0;j<dim2;j++){
            if (dim3 == 0) array[i].push(0);
            else array[i].push([]);
            for (var k=0;k<dim3;k++){
                array[i][j].push(0);
            }
        }
    }
    return array;
}