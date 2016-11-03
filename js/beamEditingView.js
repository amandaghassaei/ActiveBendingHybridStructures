/**
 * Created by ghassaei on 11/3/16.
 */


function initBeamEditingView(globals){

    return new (Backbone.View.extend({

        el: "#beamEditingControls",

        events: {
        },

        initialize: function(){
            console.log("beam editing");
        }

    }))({model:globals});
}