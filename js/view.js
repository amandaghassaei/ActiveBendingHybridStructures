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

            this.listenTo(this.model, "change:mode", this.updateUIForMode);
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
            console.log(mode);
        },

        setRadio: function(key, val){
            $(".radio>input[name=" + key + "][value=" + val + "]").prop("checked", true);
        }

    }))({model:globals});

}