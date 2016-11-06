/**
 * Created by ghassaei on 11/3/16.
 */


function initMembraneEditingView(globals){

    var membranesMetaTemplate = _.template("<% _.each(membranes, function(membrane, index){ %>" +
            '<label class="radio">'+
                '<input name="selectedMembrane" value="<%= index %>" data-toggle="radio" class="custom-radio" type="radio"><span class="icons"><span class="icon-unchecked"></span><span class="icon-checked"></span></span>'+
                'Membrane <%= index + 1 %> :  <%= membrane.numEdges %> edges <a href="#" data-index="<%=index%>" class="deleteMembrane"><span class="fui-cross"></span></a>' +
            '</label>' +
            "<% });%>");

    return new (Backbone.View.extend({

        el: "#membraneEditingControls",

        events: {
            "click .deleteMembrane": "deleteMembrane"
        },

        initialize: function(){
            $(window).bind('keyup', function(e) {
                if (globals.get("mode") !== "membraneEditing") return;
                if (e.keyCode == 13){
                    globals.structure.newMembrane();
                }
            });

            this.listenTo(this.model, "change:membranes", this.updateNumMembranes);
            this.listenTo(this.model, "change:membranes", this.updateMembranesMeta);
            this.updateNumMembranes();
        },

        updateNumMembranes: function(){
            $("#numMembranes").html(this.model.getNumMembranes());
        },

        updateMembranesMeta: function(){
            var json = this.model.getMembranesJSON();
            $("#membranesMeta").html(membranesMetaTemplate(json));
            setRadio("selectedMembrane", json.membranes.length-1, this.model.highlightMembrane);
            this.model.highlightMembrane(json.membranes.length-1);
        },

        deleteMembrane: function(e){
            e.preventDefault();
            var index = parseInt($(e.target).parent().data("index"));
            if (isNaN(index)) return;
            this.model.removeMembraneAtIndex(index);
        }

    }))({model:globals.structure});
}