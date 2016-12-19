/**
 * Created by amandaghassaei on 12/5/16.
 */


function initGradient(globals){

    var path = [];
    var fitnesses = [];
    var i = 0;
    var solved = true;

    function reset() {
        path = [];
        fitnesses = [];
        i = 0;
        solved = true;
    }

    function gradientDescent(variables){
        globals.solver.staticSolve(true);
        var _fitness = globals.fitness.calcFitness();
        fitnesses.push(_fitness);
        var _lengths = [];
        // for (var i=0;i<variables.length;i++){
            var objects = variables[i].objects;
            var length = objects[0].getSimLength();
            _lengths.push(length);

            globals.optimization.setEdgeLengthAtIndex(i, length + variables[i].stepSize);
            globals.solver.staticSolve(true);
            var posFitness = globals.fitness.calcFitness();

            globals.optimization.setEdgeLengthAtIndex(i, length - variables[i].stepSize);
            globals.solver.staticSolve(true);
            var negFitness = globals.fitness.calcFitness();

            if (negFitness<posFitness && negFitness<_fitness) {
                // _fitness = negFitness;
                solved = false;
            } else if (posFitness<_fitness){
                globals.optimization.setEdgeLengthAtIndex(i, length + variables[i].stepSize);
                // _fitness = posFitness;
                solved = false;
            } else {
                globals.optimization.setEdgeLengthAtIndex(i, length);
            }


        // }
        path.push(_lengths);
        i++;
        if (i>=variables.length){
            var _solved = solved;
            solved = true;
            i = 0;
            return _solved;
        }
        return false;
    }

    function printData(){
        console.log(JSON.stringify(path));
        console.log(JSON.stringify(fitnesses));
    }

    return {
        gradientDescent: gradientDescent,
        reset: reset,
        printData: printData
    }
}