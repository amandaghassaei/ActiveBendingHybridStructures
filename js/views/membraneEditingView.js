/**
 * Created by ghassaei on 11/3/16.
 */


function initMembraneEditingView(globals){

    var membranesMetaTemplate = _.template("<% _.each(membranes, function(membrane, index){ %>" +
            '<div class="membraneEntries">'+
                'Membrane <%= index + 1 %> : &nbsp;&nbsp;<%= membrane.numEdges %> edges <a href="#" data-index="<%=index%>" class="floatRight deleteLink deleteMembrane"><span class="fui-cross"></span></a>' +
            '</div>' +
            "<% });%>");
    var defaultMessage = "Select edges that form a closed loop and hit Enter to create a membrane.";

    return new (Backbone.View.extend({

        el: "#membraneEditingControls",

        events: {
            "click .deleteMembrane": "deleteMembrane",
            "click .clearAll": "clearAll",
            "mouseenter .membraneEntries": "highlightMembrane",
            "mouseout .membraneEntries": "unhighlightMembrane"
        },

        initialize: function(){

            this.listenTo(this.model, "change:membranes", this.updateNumMembranes);
            this.listenTo(this.model, "change:membranes", this.updateMembranesMeta);
            this.updateNumMembranes();
            this.updateMembranesMeta();
        },

        updateNumMembranes: function(){
            $("#numMembranes").html(this.model.getNumMembranes());
        },

        updateMembranesMeta: function(){
            if (this.model.getNumMembranes() == 0){
                $("#membranesMeta").html(defaultMessage);
                return;
            }
            var json = this.model.getMembranesJSON();
            $("#membranesMeta").html(membranesMetaTemplate(json));
        },

        deleteMembrane: function(e){
            e.preventDefault();
            var index = parseInt($(e.target).parent().data("index"));
            if (isNaN(index)) return;
            this.model.removeMembraneAtIndex(index);
        },

        setHighlightedMembrane: function(index){
            var membraneEntries = $("#membranesMeta").children(".membraneEntries");
            membraneEntries.removeClass("selectedEntry");
            if (index>=0){
                membraneEntries.eq(index).addClass("selectedEntry");
            }
        },

        highlightMembrane: function(e){
            var $target = $(e.target);
            $("#membranesMeta").children(".membraneEntries").removeClass("selectedEntry");
            if (!$target.hasClass("membraneEntries")) $target = $target.parents(".membraneEntries");
            var index = $target.find("a").data("index");
            if (index === undefined) return;
            this.model.highlightMembrane(index);
        },

        unhighlightMembrane: function(e){
            var $target = $(e.target);
            if (!$target.hasClass("membraneEntries")) return;
            $target = $(e.relatedTarget);
            if ($target.parents(".membraneEntries").length > 0) return;
            this.model.unhighlightMembranes();
        },

        clearAll: function(e){
            e.preventDefault();
            globals.intersector3D.setHighlightedObj(null);
            this.model.removeAllMembranes();
            $(e.target).blur();
            globals.threeView.render();
        }

    }))({model:globals.structure});
}