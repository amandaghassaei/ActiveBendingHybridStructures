/**
 * Created by ghassaei on 11/3/16.
 */


function initView(globals){

    return new (Backbone.View.extend({

        el: "body",

        events: {
            "mouseenter #logo" : "showLogo",
            "mouseleave #logo" : "hideLogo",
            "change input[name=mode]": "modeChanged"
        },

        initialize: function(){
            setRadio("mode", globals.get("mode"));
            var mesh = globals.mesh;
            setSliderInput("#meshScaleX", mesh.get("scale").x, 0.0001, 20, 0.001, this.meshScaleChanged);
            setSliderInput("#meshScaleY", mesh.get("scale").y, 0.0001, 20, 0.001, this.meshScaleChanged);
            setSliderInput("#meshScaleZ", mesh.get("scale").z, 0.0001, 20, 0.001, this.meshScaleChanged);

            this.listenTo(this.model, "change:mode", this.updateUIForMode);
            this.updateUIForMode();
        },

        showLogo: function(){
            $("#activeLogo").show();
            $("#inactiveLogo").hide();
        },
        hideLogo: function(){
            $("#activeLogo").hide();
            $("#inactiveLogo").show();
        },

        modeChanged: function(e){
            var state = $("input[name=mode]:checked").val();
            globals.set("mode", state);
        },
        updateUIForMode: function(){
            var mode = globals.get("mode");
            var self = this;
            if (this.$currentControlsDiv) this.$currentControlsDiv.animate({right:-420}, function(){
                self.$currentControlsDiv = $("#" + mode + "Controls");
                self.$currentControlsDiv.animate({right:0});
            });
            else {
                this.$currentControlsDiv = $("#" + mode + "Controls");
                this.$currentControlsDiv.animate({right:0});
            }
        },

        meshScaleChanged: function(val, id){
            var key = null;
            if (id === "#meshScaleX") key = "x";
            else if (id === "#meshScaleY") key = "y";
            else if (id === "#meshScaleZ") key = "z";
            if (key === null) {
                console.warn("invalid id");
                return;
            }
            var mesh = globals.mesh;
            var scale = mesh.get("scale").clone();
            scale[key] = val;
            mesh.set("scale", scale);
        }

    }))({model:globals});

}