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
                if (globals.get("mode") !== "membraneEditing") return;
                if (e.keyCode == 13){
                    globals.structure.newMembrane();
                }
            });

            this.listenTo(this.model, "change:membranes", this.updateNumMembranes);
            this.updateNumMembranes();
        },

        updateNumMembranes: function(){
            $("#numMembranes").html(this.model.getNumMembranes());
        }

    }))({model:globals.structure});
}