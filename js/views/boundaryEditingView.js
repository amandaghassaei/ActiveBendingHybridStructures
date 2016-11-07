/**
 * Created by ghassaei on 11/7/16.
 */


function initBoundaryEditingView(globals){

    return new (Backbone.View.extend({

        el: "#meshingControls",

        events: {
        },

        initialize: function(){

            setRadio("boundaryEditingMode", globals.get("boundaryEditingMode"), this.boundaryEditingModeChanged);

            this.listenTo(this.model, "change:numFixed", this.updateNumFixed);
            this.updateNumFixed();
        },

        updateNumFixed: function(){
            $("#numFixed").html(this.model.get("numFixed"));
        },

        boundaryEditingModeChanged: function(val){
            globals.set("boundaryEditingMode", val);
        }


    }))({model:globals.structure});
}