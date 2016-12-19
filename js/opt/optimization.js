/**
 * Created by amandaghassaei on 11/27/16.
 */


function initOptimization(globals){

    var allEdges = [];
    var allSimEdges = [];
    var edgeVariables = [];
    var startingLengths = [];
    resetEdgeVariables();

    function refreshEdges(){
        startingLengths = [];
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
        startingLengths = [];
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

    function linkEdgeByEdgeIndices(indices){
        var edgeVarIndices = [];
        for (var i=0;i<indices.length;i++){
            var edge = allEdges[indices[i]];
            for (var j=0;j<edgeVariables.length;j++){
                if (edgeVariables[j].edges.indexOf(edge)>=0) {
                    edgeVarIndices.push(j);
                    continue;
                }
            }
        }
        linkEdges(edgeVarIndices, true);
    }

    function linkEdges(indices, loading){
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
        if (loading) return;
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
                stepSize: globals.get("stepSize")
            });
        }
        return variables;
    }

    function sampleSpace(){
        sampleSpace2D();
    }

    function sampleSpace1D(){
        var min = 6.1;
        var max = 16.5;
        var val = min;
        var fitnesses = [];
        var lengths = [];
        globals.threeView.startAnimation(function(){
            if (val > max) {
                pauseOptimization();
                console.log(JSON.stringify(fitnesses));
                console.log(JSON.stringify(lengths));
            }
            else {
                fitnesses.push(sampleFitness(0, val));
                lengths.push(val);
                globals.optimizationView.setEdgeEntries();
                val+=0.01;
            }
        });
    }

    function sampleSpace2D(){
        var min = 6.4;
        var min2 = 16.9;
        var max = 16.5;
        var max2 = 25.0;
        var val = min;
        var val2 = min2;
        var fitnesses = [];
        fitnesses.push([]);
        var lengths = [];
        lengths.push([]);
        var index = 0;
        console.log(edgeVariables);
        setEdgeLengthAtIndex(1, val);
        var direction = 1;
        globals.threeView.startAnimation(function(){
            if (val > max && val2 > max2) {
                pauseOptimization();
                console.log(JSON.stringify(fitnesses));
                console.log(JSON.stringify(lengths));
            }
            if (val2>max2){
                fitnesses.push([]);
                lengths.push([]);
                val += 0.1;
                setEdgeLengthAtIndex(1, val);
                index++;
                // direction *= -1;
                //gently bring down to min
                for (var i=val2;i>min2;i--){
                    setEdgeLengthAtIndex(0, i);
                    globals.solver.staticSolve(true);
                }
                val2 = min2;
            }
            else {
                // console.log(val + " " + val2);
                fitnesses[index].push(sampleFitness(0, val2));
                lengths[index].push([val, val2]);
                globals.optimizationView.setEdgeEntries();
                val2 += direction*0.1;
            }
        });
    }

    function sampleFitness(i, length){
        setEdgeLengthAtIndex(i, length);
        globals.solver.staticSolve(true);
        return globals.fitness.calcFitness();
    }

    function startOptimization(){
        var variables = defineVariables();
        if (!globals.get("optNeedsReset")){
            startingLengths = [];
            for (var i=0;i<variables.length;i++){
                startingLengths.push(variables[i].objects[0].getSimLength());
            }
        }
        globals.set("optNeedsReset", true);
        globals.set("optimizationRunning", true);
        var solved = false;

        globals.gradient.reset();
        globals.threeView.startAnimation(function(){
            if (solved) {
                pauseOptimization();
                globals.gradient.printData();
            }
            else {
                solved = globals.gradient.gradientDescent(variables);
                globals.optimizationView.setEdgeEntries();
            }
        });
    }

    function pauseOptimization(){
        globals.threeView.stopAnimation();
        globals.set("optimizationRunning", false);
        globals.solver.staticSolve(true);
        globals.fitness.calcFitness();
    }

    function resetOptimization(){
        pauseOptimization();
        globals.set("optNeedsReset", false);
        if (startingLengths.length > 0 && startingLengths.length == edgeVariables.length){
            for (var i=0;i<startingLengths.length;i++){
                setEdgeLengthAtIndex(i, startingLengths[i]);
            }
        }
        globals.solver.reset();
        globals.fitness.calcFitness();
        globals.threeView.render();
    }

    function toJSON(){
        var json = [];
        var _allEdges = globals.structure.getAllEdges();
        for (var i=0;i<edgeVariables.length;i++){
            var edgeIndices = [];
            for (var j=0;j<edgeVariables[i].edges.length;j++){
                edgeIndices.push(_allEdges.indexOf(edgeVariables[i].edges[j]));
            }
            json.push({
                edges: edgeIndices,
                active: edgeVariables[i].active
            });
        }
        return json;
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
        linkEdgeByEdgeIndices: linkEdgeByEdgeIndices,
        unlinkEdges: unlinkEdges,
        startOptimization: startOptimization,
        pauseOptimization: pauseOptimization,
        resetOptimization: resetOptimization,
        toJSON: toJSON,
        sampleSpace: sampleSpace
    }
}