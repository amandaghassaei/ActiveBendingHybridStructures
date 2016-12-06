/**
 * Created by amandaghassaei on 11/27/16.
 */


function initOptimization(globals){

    var allEdges;
    var allSimEdges;
    var edgeVariables;
    resetEdgeVariables();

    function refreshEdges(){
        var _allEdges = [];
        for (var i=0;i<globals.structure.beams.length;i++){
            _allEdges = _allEdges.concat(globals.structure.beams[i].getEdges());
        }
        var _allSimEdges = [];
        for (var i=0;i<globals.structure.simBeams.length;i++){
            _allSimEdges = _allSimEdges.concat(globals.structure.simBeams[i].getEdges());
        }
        var usedIndices = [];
        for (var i=edgeVariables.length-1;i>=0;i--){
            for (var j=edgeVariables[i].edges.length-1;j>=0;j--){
                var index = _allEdges.indexOf(edgeVariables[i].edges[j]);
                if (index<0){
                    if (edgeVariables[i].edges.length == 1){//delete entry
                        edgeVariables.splice(i, 1);
                    } else {
                        edgeVariables[i].edges.splice(index,1);
                    }
                } else {
                    usedIndices.push(index);
                }
            }
        }
        for (var i=0;i<_allEdges.length;i++){
            if (usedIndices.indexOf(i) <  0){
                edgeVariables.push({
                    edges: [_allEdges[i]],
                    active: true
                });
            }
        }
        allEdges = _allEdges;
        allSimEdges = _allSimEdges;
    }

    function resetEdgeVariables(){
        var _allEdges = [];
        for (var i=0;i<globals.structure.beams.length;i++){
            _allEdges = _allEdges.concat(globals.structure.beams[i].getEdges());
        }
        var _allSimEdges = [];
        for (var i=0;i<globals.structure.simBeams.length;i++){
            _allSimEdges = _allSimEdges.concat(globals.structure.simBeams[i].getEdges());
        }
        var _edgeVariables = [];
        for (var i=0;i<_allEdges.length;i++){
            _edgeVariables.push({
                edges: [_allEdges[i]],
                active: true
            });
        }
        edgeVariables = _edgeVariables;
        allEdges = _allEdges;
        allSimEdges = _allSimEdges;
    }

    function getEdgeVariableData(){//for ui
        var data = [];
        for (var i=0;i<edgeVariables.length;i++){
            var entry = {};
            entry.indices = [];
            entry.active = edgeVariables[i].active;
            entry.length = edgeVariables[i].edges[0].getSimLength();
            for (var j=0;j<edgeVariables[i].edges.length;j++){
                var index = allEdges.indexOf(edgeVariables[i].edges[j]);
                if (index<0){
                    console.warn("bad index");
                    continue;
                }
                entry.indices.push(index);
            }
            data.push(entry);
        }
        return data;
    }

    function getEdgeVariables(){
        return edgeVariables;
    }

    function linkEdges(indices){
        //set length to avg
        var avgLength = 0;
        for (var i=0;i<indices.length;i++){
            avgLength += edgeVariables[indices[i]].edges[0].getSimLength();
        }
        avgLength /= indices.length;
        var edges = [];
        for (var i=edgeVariables.length-1;i>=0;i--){
            if (indices.indexOf(i) >= 0){
                edges = edges.concat(edgeVariables[i].edges);
                edgeVariables.splice(i, 1);
            }
        }
        var entry = {};
        entry.length = avgLength;
        entry.edges = edges;
        entry.active = true;
        edgeVariables.push(entry);
        setEdgeLengthAtIndex(edgeVariables.length-1, avgLength);
    }
    function unlinkEdges(index){
        var length = edgeVariables[index].length;
        var edges = edgeVariables[index].edges;
        var active = edgeVariables[index].active;
        edgeVariables.splice(index, 1);
        for (var i=0;i<edges.length;i++){
            edgeVariables.push({
                edges: [edges[i]],
                active: active,
                length: length
            });
        }
    }

    function setEdgeLengthAtIndex(index, length){
        if (edgeVariables.length<= index){
            console.warn("index out of range");
            return;
        }
        var edges = edgeVariables[index].edges;
        for (var i=0;i<edges.length;i++){
            edges[i].setSimLength(length);
            var index = allEdges.indexOf(edges[i]);
            if (index<0) console.warn("bad index");
            else allSimEdges[index].setLength(length);
        }
        //update sim
        globals.solver.updateBeamLengths();
    }

    function restoreEdgeLengthDefaults(){
        resetEdgeVariables();
        for (var j=0;j<edgeVariables.length;j++){
            var edges = edgeVariables[j].edges;
            for (var i=0;i<edges.length;i++){
                var length = edges[i].resetSimLength();
                var index = allEdges.indexOf(edges[i]);
                if (index<0) console.warn("bad index");
                else allSimEdges[index].setLength(length);
            }
        }
        //update sim
        globals.solver.updateBeamLengths();
    }

    function setEdgeStateAtIndex(index, state){
        if (edgeVariables.length<= index){
            console.warn("index out of range");
            return;
        }
        edgeVariables[index].active = state;
    }

    function defineVariables(){
        var variables = [];
        for (var i=0;i<edgeVariables.length;i++){
            if (!edgeVariables[i].active) continue;
            variables.push({
                objects: edgeVariables[i].edges,
                stepSize: 1
            });
        }
        return variables;
    }

    function startOptimization(){
        globals.set("optNeedsReset", true);
        globals.set("optimizationRunning", true);
        var solved = false;
        globals.threeView.startAnimation(function(){
            if (solved) pauseOptimization();
            else solved = globals.gradient.gradientDescent(defineVariables());
        });
    }

    function pauseOptimization(){
        globals.threeView.stopAnimation();
        globals.set("optimizationRunning", false);
    }

    function resetOptimization(){
        pauseOptimization();
        globals.set("optNeedsReset", false);
        globals.solver.reset();
        globals.fitness.calcFitness();
        globals.threeView.render();
    }

    return {
        refreshEdges: refreshEdges,
        resetEdgeVariables: resetEdgeVariables,
        getEdgeVariableData: getEdgeVariableData,
        getEdgeVariables: getEdgeVariables,
        setEdgeLengthAtIndex: setEdgeLengthAtIndex,
        setEdgeStateAtIndex: setEdgeStateAtIndex,
        restoreEdgeLengthDefaults: restoreEdgeLengthDefaults,
        linkEdges: linkEdges,
        unlinkEdges: unlinkEdges,
        startOptimization: startOptimization,
        pauseOptimization: pauseOptimization,
        resetOptimization: resetOptimization
    }
}