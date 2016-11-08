/**
 * Created by ghassaei on 11/4/16.
 */


function SimMembrane(simEdges, simNodes, parent){
    this.object3D = new THREE.Object3D();
    parent.add(this.object3D);
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

SimMembrane.prototype.meshParallel = function(numElements){
    this.destroyInnerNodes();

    var side0 = this.borderNodes.slice(1, numElements);
    var side1 = this.borderNodes.slice(numElements+1, 2*numElements);
    var side2 = this.borderNodes.slice(2*numElements+1, 3*numElements);
    var side3 = this.borderNodes.slice(3*numElements+1, 4*numElements);
    side2.reverse();
    side3.reverse();

    var lastLayer = side0;

    var node, edge;
    for (var i=0;i<numElements-1;i++){
        var lastNode = side3[i];
        var nextLayer = [];
        for (var j=0;j<numElements-1;j++){
            node = new SimNode(new THREE.Vector3(), this.object3D);
            nextLayer.push(node);
            this.innerNodes.push(node);
            edge = new SimTensionEl([node, lastLayer[j]], this, this.object3D);
            this.innerEdges.push(edge);
            edge = new SimTensionEl([node, lastNode], this, this.object3D);
            this.innerEdges.push(edge);
            lastNode = node;
        }
        edge = new SimTensionEl([side1[i], lastNode], this, this.object3D);
        this.innerEdges.push(edge);
        lastLayer = nextLayer;
    }
    for (var j=0;j<numElements-1;j++){
        edge = new SimTensionEl([side2[j], lastLayer[j]], this, this.object3D);
        this.innerEdges.push(edge);
    }
    this.hideNodes();
    this.setupStaticMatrices();
};

SimMembrane.prototype.meshRadial = function(numLayers){
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
                edge = new SimTensionEl([node, nextLayer[i-1]], this, this.object3D);
                this.innerEdges.push(edge);
                if (i==this.borderNodes.length){
                    edge = new SimTensionEl([node, nextLayer[0]], this, this.object3D);
                    this.innerEdges.push(edge);
                }
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
    this.hideNodes();
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
    this.C = initEmptyArray(numEdges, numNodes);
    this.Cf = initEmptyArray(numEdges, numBorderNodes);
    this.Q = initEmptyArray(numEdges, numEdges);
    this.Xf = initEmptyArray(numBorderNodes);

    for (var i=0;i<numEdges;i++){
        var edge = this.innerEdges[i];
        var _nodes = edge.getNodes();
        if (_nodes[0].isBeamNode) this.Cf[i][this.borderNodes.indexOf(_nodes[0])] = 1;
        else this.C[i][this.innerNodes.indexOf(_nodes[0])] = 1;
        if (_nodes[1].isBeamNode) this.Cf[i][this.borderNodes.indexOf(_nodes[1])] = -1;
        else this.C[i][this.innerNodes.indexOf(_nodes[1])] = -1;
        this.Q[i][i] = edge.getForceDensity();
    }

    for (var i=0;i<numBorderNodes;i++){
        var position = this.borderNodes[i].getPosition();
        this.Xf[i] = [-position.x, -position.y, -position.z];
    }

    this.Ctranspose = numeric.transpose(this.C);
    var Ctrans_Q = numeric.dot(this.Ctranspose, this.Q);
    var Ctrans_Q_C = numeric.dot(Ctrans_Q, this.C);
    this.inv_Ctrans_Q_C = numeric.inv(Ctrans_Q_C);
    this.Ctrans_Q_Cf = numeric.dot(Ctrans_Q, this.Cf);
    var Ctrans_Q_Cf_Xf = numeric.dot(this.Ctrans_Q_Cf, this.Xf);

    this.solve(Ctrans_Q_Cf_Xf);
};

SimMembrane.prototype.updateQs = function(){
    for (var i=0;i<this.innerEdges.length;i++){
        this.Q[i][i] = this.innerEdges[i].getForceDensity();
    }
    var Ctrans_Q = numeric.dot(this.Ctranspose, this.Q);
    var Ctrans_Q_C = numeric.dot(Ctrans_Q, this.C);
    this.inv_Ctrans_Q_C = numeric.inv(Ctrans_Q_C);
    this.Ctrans_Q_Cf = numeric.dot(Ctrans_Q, this.Cf);
    var Ctrans_Q_Cf_Xf = numeric.dot(this.Ctrans_Q_Cf, this.Xf);

    this.solve(Ctrans_Q_Cf_Xf);
};

SimMembrane.prototype.updateBoundaries = function(){
    for (var i=0;i<this.Xf.length;i++){
        var position = this.borderNodes[i].getPosition();
        this.Xf[i] = [-position.x, -position.y, -position.z];
    }
    var Ctrans_Q_Cf_Xf = numeric.dot(this.Ctrans_Q_Cf, this.Xf);
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


SimMembrane.prototype.setEdgeMaterial = function(material){
    for (var i=0;i<this.innerEdges.length;i++){
        this.innerEdges[i].setMaterial(material);
    }
};
SimMembrane.prototype.setNodeMaterial = function(material){
    for (var i=0;i<this.innerNodes.length;i++){
        this.innerNodes[i].setMaterial(material);
    }
};
SimMembrane.prototype.hideNodes = function(){
    for (var i=0;i<this.innerNodes.length;i++){
        this.innerNodes[i].hide();
    }
};
SimMembrane.prototype.showNodes = function(){
    for (var i=0;i<this.innerNodes.length;i++){
        this.innerNodes[i].show();
    }
};

SimMembrane.prototype.getSimEdges = function(){
    return this.simEdges;
};


SimMembrane.prototype.destroy = function(){
    this.destroyInnerNodes();
    this.object3D = null;
    this.simEdges = null;
    this.simNodes = null;
    this.borderNodes = null;
    this.C = null;
    this.Cf = null;
    this.Q = null;
    this.Xf = null;
    this.Ctranspose = null;
    this.inv_Ctrans_Q_C = null;
    this.Ctrans_Q_Cf = null;
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