/**
 * Created by ghassaei on 11/3/16.
 */


function initIntersector3D(globals){

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    var raycasterPlane = new THREE.Plane(new THREE.Vector3(0,0,1));
    var highlightedObj;
    var isDragging = false;
    var mouseDown = false;

    function setHighlightedObj(object){
        if (highlightedObj && (object != highlightedObj)) {
            highlightedObj.unhighlight();
            //globals.controls.hideMoreInfo();
        }
        highlightedObj = object;
        if (highlightedObj) highlightedObj.highlight();
        globals.threeView.render();
    }

    $(document).dblclick(function() {
    });

    document.addEventListener('mousedown', function(e){
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
        isDragging = false;
        mouseDown = false;
    }, false);

    document.addEventListener('mousemove', function mouseMove(e){
        if (mouseDown) {
            isDragging = true;
        }

        e.preventDefault();
        mouse.x = (e.clientX/window.innerWidth)*2-1;
        mouse.y = - (e.clientY/window.innerHeight)*2+1;
        raycaster.setFromCamera(mouse, globals.threeView.camera);

        var mode = globals.get("mode");
        switch(mode){
            case "meshEditing":
                return;
                break;
            case "beamEditing":
                var position = getPointOfIntersectionWithObject(globals.mesh.getObject3D());
                if (position === null){

                } else {

                }
                break;
            case "membraneEditing":
                break;
        }

        var _highlightedObj = null;
        setHighlightedObj(_highlightedObj);

    }, false);

    function getIntersectionWithObjectPlane(position){
        var cameraOrientation = globals.threeView.camera.getWorldDirection();
        var dist = position.dot(cameraOrientation);
        raycasterPlane.set(cameraOrientation, -dist);
        var intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(raycasterPlane, intersection);
        return intersection;
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
                } else if (thing.object && thing.object._myBeam && thing.object._myBeam.type == "beam") {
                    _highlightedObj = thing.object._myBeam;
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