/**
 * Created by ghassaei on 11/3/16.
 */


function initBeamEditingView(globals){

    return new (Backbone.View.extend({

        el: "#beamEditingControls",

        events: {
            "click #newBeamMode": "setNewBeamMode"
        },

        initialize: function(){

            _.bindAll(this, "snapToVertexChanged");
            setCheckbox("#snapToVertex", globals.get("snapToVertex"), this.snapToVertexChanged);

            this.listenTo(this.model, "change:beams", this.updateNumBeams);
            this.updateNumBeams();
            this.listenTo(this.model, "change:nodes", this.updateNumNodes);
            this.updateNumNodes();
        },

        updateNumBeams: function(){
            $("#numBeams").html(this.model.getNumBeams());
        },
        updateNumNodes: function(){
            $("#numNodes").html(this.model.getNumNodes());
        },

        snapToVertexChanged: function(state){
            globals.set("snapToVertex", state);
        },

        setNewBeamMode: function(e){
            e.preventDefault();
            globals.set("newBeamMode", true);
        }

    }))({model:globals.structure});
}