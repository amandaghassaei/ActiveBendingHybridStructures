/**
 * Created by ghassaei on 11/3/16.
 */


function initMembraneEditingView(globals){

    return new (Backbone.View.extend({

        el: "#membraneEditingControls",

        events: {
        },

        initialize: function(){
            $(window).bind('keyup', function(e) {
                if (e.keyCode == 13 && globals.get("mode") === "membraneEditing"){
                    globals.structure.newMembrane();
                }
            });
        }

    }))({model:globals.structure});
}