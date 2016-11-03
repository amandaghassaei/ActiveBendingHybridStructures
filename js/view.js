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
            this.setRadio("mode", globals.get("mode"));
            var mesh = globals.mesh;
            this.setSliderInput("#meshScaleX", mesh.get("scale").x, 0.0001, 20, 0.001, this.meshScaleChanged);
            this.setSliderInput("#meshScaleY", mesh.get("scale").y, 0.0001, 20, 0.001, this.meshScaleChanged);
            this.setSliderInput("#meshScaleZ", mesh.get("scale").z, 0.0001, 20, 0.001, this.meshScaleChanged);

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
            globals.mesh.setScale(key, val);
        },

        setRadio: function(key, val){
            $(".radio>input[name=" + key + "][value=" + val + "]").prop("checked", true);
        },

        setSliderInput: function(id, val, min, max, incr, callback){

            var slider = $(id+">div").slider({
                orientation: 'horizontal',
                range: false,
                value: val,
                min: min,
                max: max,
                step: incr
            });

            var $input = $(id+">input");
            $input.change(function(){
                var val = $input.val();
                if ($input.hasClass("int")){
                    if (isNaN(parseInt(val))) return;
                    val = parseInt(val);
                } else {
                    if (isNaN(parseFloat(val))) return;
                    val = parseFloat(val);
                }

                var min = slider.slider("option", "min");
                if (val < min) val = min;
                if (val > max) val = max;
                $input.val(val);
                slider.slider('value', val);
                callback(val, id);
            });
            $input.val(val);
            slider.on("slide", function(e, ui){
                var val = ui.value;
                $input.val(val);
                callback(val, id);
            });
        }

    }))({model:globals});

}