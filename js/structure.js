/**
 * Created by ghassaei on 11/3/16.
 */


function initStructure(globals){

    var intersector = initIntersector3D(globals);

    return new (Backbone.Model.extend({

        defaults: {
        },

        initialize: function(){

            this.beams = [];
        },

        newBeam: function(){
            this.trigger("change:beams");
        },

        getNumBeams: function(){
            return this.beams.length;
        }

    }))();
}