/**
 * Created by amandaghassaei on 12/5/16.
 */


function initGradient(globals){

    function gradientDescent(variables){
        globals.solver.staticSolve(true);
        var _fitness = globals.fitness.calcFitness();
        var solved = true;
        for (var i=0;i<variables.length;i++){
            var objects = variables[i].objects;
            var length = objects[0].getSimLength();

            globals.optimization.setEdgeLengthAtIndex(i, length + variables[i].stepSize);
            globals.solver.staticSolve(true);
            var posFitness = globals.fitness.calcFitness();

            globals.optimization.setEdgeLengthAtIndex(i, length - variables[i].stepSize);
            globals.solver.staticSolve(true);
            var negFitness = globals.fitness.calcFitness();

            if (negFitness<posFitness && negFitness<_fitness) {
                _fitness = negFitness;
                solved = false;
                continue;
            } else if (posFitness<_fitness){
                globals.optimization.setEdgeLengthAtIndex(i, length + variables[i].stepSize);
                _fitness = posFitness;
                solved = false;
                continue;
            }

            globals.optimization.setEdgeLengthAtIndex(i, length);
        }
        return solved;
    }

    return {
        gradientDescent: gradientDescent
    }
}