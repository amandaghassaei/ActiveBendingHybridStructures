/**
 * Created by ghassaei on 11/3/16.
 */


function initIntersector3D(globals, structure){

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    var raycasterPlane = new THREE.Plane(new THREE.Vector3(0,0,1));
    var highlightedObj;
    var isDragging = false;
    var mouseDown = false;

    var node = new Node(new THREE.Vector3(), globals.threeView.scene);
    node.type = "dummy";
    var _nodeMaterial = node.getObject3D().material.clone();
    var _nodeDeleteMaterial = nodeMaterialDelete.clone();
    _nodeDeleteMaterial.transparent = true;
    _nodeDeleteMaterial.side = THREE.DoubleSide;
    _nodeDeleteMaterial.opacity = 0.5;
    _nodeMaterial.transparent = true;
    _nodeMaterial.side = THREE.DoubleSide;
    _nodeMaterial.opacity = 0.5;
    node.getObject3D().material = _nodeMaterial;
    node.hide();

    var listener = _.extend({}, Backbone.Events);
    listener.listenTo(globals, "change:deleteNodeMode", function(){
        if (globals.get("deleteNodeMode")) {
            node.getObject3D().material = _nodeDeleteMaterial;
            if (highlightedObj && highlightedObj.type == "node") highlightedObj.setDeleteMode();
        }
        else {
            node.getObject3D().material = _nodeMaterial;
            node.hide();
            if (highlightedObj && highlightedObj.type == "node") highlightedObj.highlight();
        }
        globals.threeView.render();
    });

    function setHighlightedObj(object){
        var shouldRender = false;
        if (highlightedObj && (object != highlightedObj)) {
            highlightedObj.unhighlight();
            shouldRender = true;
        }
        highlightedObj = object;
        if (highlightedObj) {
            object.highlight();
            shouldRender = true;
        }
        if (shouldRender) globals.threeView.render();
    }

    $(document).dblclick(function() {
    });

    document.addEventListener('mousedown', function(e){
        var $target = $(e.target);
        if ($target.is("span") || $target.hasClass("modal") || $target.hasClass("radio") || $target.hasClass("checkbox") || $target.is("a")) return;
        switch (e.which) {
            case 1://left button
                mouseDown = true;
                break;
            case 2://middle button
                break;
            case 3://right button
                break;
        }
    }, false);

    document.addEventListener('mouseup', function(e){
        mouseDown = false;
        if (!isDragging){
            var $target = $(e.target);
            if ($target.is("span") || $target.hasClass("modal") || $target.hasClass("radio") || $target.hasClass("checkbox") || $target.is("a")) return;
            switch (e.which) {
                case 1://left button
                    var mode = globals.get("mode");
                    if (mode === "beamEditing") {
                        if (globals.get("deleteNodeMode")){
                            if (highlightedObj && highlightedObj.type == "node") {
                                var deleted = structure.removeNode(highlightedObj);
                                if (deleted) highlightedObj = null;
                                else setHighlightedObj(null);
                            }
                            globals.set("deleteNodeMode", false);
                            break;
                        }
                        if (highlightedObj && highlightedObj.type == "node") {
                            structure.addNodeToBeam(highlightedObj);
                        } else {
                            structure.stopEditingBeam();
                        }
                        if (node.isVisible()) {
                            structure.newNode(node.getPosition());
                        }
                        globals.threeView.render();
                    } else if (mode === "membraneEditing"){
                        if (highlightedObj && highlightedObj.type == "edge") {
                            structure.selectEdge(highlightedObj);
                        }
                        globals.threeView.render();
                    }
                    break;
                case 2://middle button
                    break;
                case 3://right button
                    break;
            }
        }
        isDragging = false;
    }, false);

    document.addEventListener('mousemove', function mouseMove(e){
        if (mouseDown) {
            isDragging = true;
        }

        e.preventDefault();
        mouse.x = (e.clientX/window.innerWidth)*2-1;
        mouse.y = - (e.clientY/window.innerHeight)*2+1;
        raycaster.setFromCamera(mouse, globals.threeView.camera);

        if (isDragging) {
            if (node.hide()) globals.threeView.render();
            setHighlightedObj(null);
            return;
        }

        var _highlightedObj = null;
        var mode = globals.get("mode");
        switch(mode){
            case "meshEditing":
                return;
                break;
            case "beamEditing":
                _highlightedObj = checkForIntersections(e, structure.getNodesToIntersect());
                if (_highlightedObj){
                    node.hide();
                    setHighlightedObj(_highlightedObj);
                    if (globals.get("deleteNodeMode") && _highlightedObj.type == "node") {
                        _highlightedObj.setDeleteMode();
                        globals.threeView.render();
                    }
                    return;
                }
                setHighlightedObj(_highlightedObj);

                if (structure.currentEditingBeam){
                    var intersection = getIntersectionWithObjectPlane(new THREE.Vector3());
                    structure.currentEditingBeam.setEnd(intersection);
                    globals.threeView.render();
                    return;
                }

                var intersection = getIntersectionWithObject(globals.mesh.getObject3D());
                if (intersection === null){
                    node.hide();
                    globals.threeView.render();
                    return;
                } else {
                    var position = intersection.point;
                    if (!globals.get("deleteNodeMode") && globals.get("snapToVertex")){
                        var geometry = intersection.object.geometry;
                        var face = geometry.faces[intersection.faceIndex];
                        var vertices = [];
                        vertices.push(geometry.vertices[face.a]);
                        vertices.push(geometry.vertices[face.b]);
                        vertices.push(geometry.vertices[face.c]);
                        var dist = vertices[0].clone().sub(position).length();
                        var _position = vertices[0];
                        for (var i=1;i<3;i++){
                            var _dist = vertices[i].clone().sub(position).length();
                            if (_dist<dist){
                                dist = _dist;
                                _position = vertices[i];
                            }
                        }
                        position = _position;
                    }
                    node.move(position);
                    node.show();
                    globals.threeView.render();
                    return;
                }
                break;
            case "membraneEditing":
                _highlightedObj = checkForIntersections(e, structure.getEdgesToIntersect());
                setHighlightedObj(_highlightedObj);
                return;
                break;
            case "boundaryEditing":
                break;
        }

        //setHighlightedObj(_highlightedObj);

    }, false);

    function getIntersectionWithObjectPlane(position){
        var cameraOrientation = globals.threeView.camera.getWorldDirection();
        var dist = position.dot(cameraOrientation);
        raycasterPlane.set(cameraOrientation, -dist);
        var intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(raycasterPlane, intersection);
        return intersection;
    }

    function getIntersectionWithObject(object){
        var intersections = raycaster.intersectObjects([object], false);
        if (intersections.length > 0) {
            return intersections[0];
        }
        return null;
    }

    function getPointOfIntersectionWithObject(object){
        var intersections = raycaster.intersectObjects([object], false);
        if (intersections.length > 0) {
            return intersections[0].point;
        }
        return null;
    }

    function checkForIntersections(e, objects){
        var _highlightedObj = null;
        var intersections = raycaster.intersectObjects(objects, true);
        if (intersections.length > 0) {
            var objectFound = false;
            _.each(intersections, function (thing) {
                if (objectFound) return;
                if (thing.object && thing.object._myNode && thing.object._myNode.type == "node"){
                    _highlightedObj = thing.object._myNode;
                    objectFound = true;
                } else if (thing.object && thing.object._myEdge && thing.object._myEdge.type == "edge") {
                    _highlightedObj = thing.object._myEdge;
                    objectFound = true;
                } else if (thing.object && thing.object._myForce && thing.object._myForce.type == "force") {
                    _highlightedObj = thing.object._myForce;
                    objectFound = true;
                }
            });
        }
        return _highlightedObj;
    }

    return {

    }
}