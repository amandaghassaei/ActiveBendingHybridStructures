/**
 * Created by amandaghassaei on 12/18/16.
 */


function initFab(globals){

    var origBaseGeo = new THREE.CubeGeometry(1,1,1);
    var csgResult;
    // globals.threeView.sceneAdd(base);
    hide();

    var beams = [];

    var listener = _.extend({}, Backbone.Events);
    listener.listenTo(globals, "change:mode", function(){
        var mode = globals.get("mode");
        if (mode === "fabrication"){
            beams = [];
            for (var i=0;i<globals.structure.simNodes.length;i++){
                if (globals.structure.simNodes[i].fixed){
                    beams = beams.concat(globals.structure.simNodes[i].getBeamElements());
                }
            }
            show();
        } else {
            hide();
        }
    });
    listener.listenTo(globals, "change:baseThickness change:edgeThickness change:mountDepth change:stockRadius", function(){
        show();
    });


    function show(){

        //calc size
        var fixedPositions =[];
        for (var i=0;i<globals.structure.nodes.length;i++){
            if (globals.structure.nodes[i].fixed) fixedPositions.push(globals.structure.nodes[i].getPosition());
        }
        if (fixedPositions.length == 0) {
            console.warn("no fixed nodes");
            hide();
            return;
        }
        var min = fixedPositions[0].clone();
        var max = fixedPositions[0].clone();
        for (var i=1;i<fixedPositions.length;i++){
            min.min(fixedPositions[i]);
            max.max(fixedPositions[i]);
        }

        var thickness = globals.get("baseThickness");
        if (max.y-min.y<thickness) min.y = max.y-thickness;
        max.y += globals.get("mountDepth");
        var avg = min.clone().add(max).multiplyScalar(0.5);
        var baseGeo = origBaseGeo.clone();
        var size = max.clone().sub(min);
        var edgeThickness = globals.get("edgeThickness");
        baseGeo.scale(size.x+2*edgeThickness, size.y, size.z+2*edgeThickness);
        baseGeo.applyMatrix(new THREE.Matrix4().makeTranslation(avg.x, avg.y, avg.z));

        var csgGeo = new ThreeBSP(baseGeo);

        for (var i=0;i<beams.length;i++){
            var beamBSP = new ThreeBSP(beams[i].getCylinderGeo());
            csgGeo = csgGeo.subtract(beamBSP);
        }

        globals.threeView.sceneRemove(csgResult);
        csgResult = csgGeo.toMesh( new THREE.MeshPhongMaterial({shading: THREE.FlatShading, color:0xb67df0}));
		csgResult.geometry.computeVertexNormals();
		globals.threeView.sceneAdd(csgResult);

        globals.threeView.render();
    }

    function hide(){
        if (csgResult) csgResult.visible = false;
        globals.threeView.render();
    }

    function saveSTL(){

        var scale = 1;

        // var data = [];
        // _.each(object3D.children, function(child){
        //     var geo = child.geometry.clone();
        //     geo.applyMatrix(new THREE.Matrix4().makeScale(child.scale.x*scale, child.scale.y*scale, child.scale.z*scale));
        //     geo.applyMatrix(new THREE.Matrix4().makeRotationFromQuaternion(child.quaternion));
        //     geo.applyMatrix(new THREE.Matrix4().makeTranslation(child.position.x*scale, child.position.y*scale, child.position.z*scale));
        //     data.push({geo: geo, offset:new THREE.Vector3(0,0,0), orientation:new THREE.Quaternion(0,0,0,1)});
        // });
        //
        // if (globals.addBase){
        //     var geo = base.geometry.clone();
        //     geo.applyMatrix(new THREE.Matrix4().makeScale(base.scale.x*scale, base.scale.y*scale, base.scale.z*scale));
        //     geo.applyMatrix(new THREE.Matrix4().makeRotationFromQuaternion(base.quaternion));
        //     geo.applyMatrix(new THREE.Matrix4().makeTranslation(base.position.x*scale, base.position.y*scale, base.position.z*scale));
        //     data.push({geo: geo, offset:new THREE.Vector3(0,0,0), orientation:new THREE.Quaternion(0,0,0,1)});
        // }
        //
        // var stlBin = geometryToSTLBin(data);
        // if (!stlBin) return;
        // var blob = new Blob([stlBin], {type: 'application/octet-binary'});
        // saveAs(blob, "shell.stl");
    }

    return {
        saveSTL: saveSTL
    }
}