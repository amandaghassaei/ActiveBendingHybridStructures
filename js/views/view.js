/**
 * Created by ghassaei on 11/3/16.
 */


function initView(globals){

    return new (Backbone.View.extend({

        el: "body",

        events: {
            "mouseenter #logo" : "showLogo",
            "mouseleave #logo" : "hideLogo",
            "click #about" : "showAbout"
        },

        initialize: function(){

            _.bindAll(this, "modeChanged");

            setRadio("mode", globals.get("mode"), this.modeChanged);
            var mesh = globals.mesh;
            setSliderInput("#meshScaleX", mesh.get("scale").x, 0.0001, 20, 0.001, this.meshScaleChanged);
            setSliderInput("#meshScaleY", mesh.get("scale").y, 0.0001, 20, 0.001, this.meshScaleChanged);
            setSliderInput("#meshScaleZ", mesh.get("scale").z, 0.0001, 20, 0.001, this.meshScaleChanged);

            setSliderInput("#meshOpacity", mesh.get("meshOpacity"), 0, 1, 0.01, function(val){
                mesh.set("meshOpacity", val);
            });
            setCheckbox("#showMesh", mesh.get("showMesh"), function(state){
                mesh.set("showMesh", state);
            });

            this.listenTo(this.model, "change:mode", this.updateUIForMode);
            this.updateUIForMode();
        },

        showWarningModal: function(text){
            $("#warningModalP").html(text);
            $("#warningModal").modal('show');
        },

        showAbout: function(e){
            e.preventDefault();
            $('#aboutModal').modal('show');
        },

        showLogo: function(){
            $("#activeLogo").show();
            $("#inactiveLogo").hide();
        },
        hideLogo: function(){
            $("#activeLogo").hide();
            $("#inactiveLogo").show();
        },

        modeChanged: function(){
            var state = $("input[name=mode]:checked").val();
            var warning = this.shouldChangeToMode(state);
            if (warning) {
                this.showWarningModal(warning);
                $(".radio>input[name=mode][value=" + globals.get("mode") + "]").prop("checked", true);
                return;
            }
            globals.set("mode", state);
        },
        shouldChangeToMode: function(mode){
            if (mode === "meshEditing") return null;
            if (!globals.mesh.meshLoaded()) return 'You need to import a target mesh first, do this in the "Mesh Editing Mode".';
            if (mode === "beamEditing") return null;
            if (globals.structure.getNumBeams()==0) return 'You need to add beams before moving on to the next step of the design process, do this in "Nodes and Beam Editing Mode".';
            if (mode === "membraneEditing") return null;
            //if (globals.structure.getNumMembranes()==0) return 'You need to add membranes before moving on to the next step of the design process, do this in "Membrane Editing Mode".';
            if (mode === "meshing") return null;
            if (mode === "boundaryEditing") return null;
            if (globals.structure.get("numFixed") == 0) return 'You must define at least one fixed node before moving on to simulation and optimization, do this in "Boundaries Editing Mode".';
            if (mode === "simulation") return null;
            if (mode === "optimization") return null;
            return null;
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
            if (mode === "meshEditing") $("#meshOptions").hide();
            else $("#meshOptions").show();

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