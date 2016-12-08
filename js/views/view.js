/**
 * Created by ghassaei on 11/3/16.
 */


function initView(globals){

    return new (Backbone.View.extend({

        el: "body",

        events: {
            "mouseenter #logo" : "showLogo",
            "mouseleave #logo" : "hideLogo",
            "click #about" : "showAbout",
            "click #saveGeo": "saveGeo",
            "click #loadGeo": "loadGeo"
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
                if (state){
                    $("#meshOpacity").show();
                } else {
                    $("#meshOpacity").hide();
                }
            });

            var reader = new FileReader();

            reader.addEventListener("load", function(){
                console.log("loaded");
                if (!reader.result){
                    console.warn("no reader result");
                }
                // try {
                    var json = JSON.parse(reader.result);
                    if (json.structure){
                        globals.structure.reset();
                    }
                    if (json.globals){
                        _.each(json.globals, function(val, key){
                            globals.set(key, val);
                        });
                    }
                    if (json.mesh){
                        _.each(json.mesh, function(val, key){
                            if (key == "scale"){
                                var scale = new THREE.Vector3(val.x, val.y, val.z);
                                globals.mesh.set(key, scale);
                            } else{
                                globals.mesh.set(key, val);
                            }
                        });
                        globals.set("autoDeleteGeo", false);
                        checkboxCallbacks["#autoDeleteGeo"](false);
                        globals.mesh.loadSTL(globals.mesh.get("url"));
                        globals.meshView.resetUI();
                        // globals.mesh.set("showMesh", true);
                        // global.mesh.set("opacity", globals.mesh.defaults.meshOpacity);
                        // checkboxCallbacks["#showMesh"](globals.mesh.get("showMesh"));
                        // sliderInputs["#meshOpacity"](globals.mesh.get("meshOpacity"));
                    }
                    if (json.structure){
                        var nodesJSON = json.structure.nodes;
                        for (var i=0;i<nodesJSON.length;i++){
                            var position = nodesJSON[i].position;
                            var node = globals.structure.newNode(new THREE.Vector3(position.x,position.y,position.z));
                            node.setFixed(nodesJSON[i].fixed);
                        }
                        var beamsJSON = json.structure.beams;
                        for (var i=0;i<beamsJSON.length;i++){
                            var beamJSON = beamsJSON[i];
                            globals.structure.currentEditingBeam = null;
                            for (var j=0;j<beamJSON.nodes.length;j++){
                                globals.structure.addNodeToBeam(globals.structure.nodes[beamJSON.nodes[j]]);
                            }
                            var beam = globals.structure.currentEditingBeam;
                            beam.closedLoop = beamJSON.closedLoop;
                            globals.structure.currentEditingBeam = null;
                        }
                        globals.structure.selectedEdges = [];
                        var allEdges = globals.structure.getAllEdges();
                        for (var i=0;i<json.structure.membranes.length;i++){
                            var membraneJSON = json.structure.membranes[i];
                            for (var j=0;j<membraneJSON.edges.length;j++){
                                globals.structure.selectEdge(allEdges[membraneJSON.edges[j]]);
                            }
                            globals.structure.newMembrane();
                        }
                    }
                    globals.set("mode", "beamEditing");
                    $(".radio>input[name=mode][value=" + globals.get("mode") + "]").prop("checked", true);
                    globals.beamEditingView.updateNodesMeta();
                    globals.beamEditingView.updateBeamsMeta();
                // } catch (e){
                //     console.warn(e);
                // }
            }, false);

            $("#jsonInput").change(function(e){
                var files = $(e.target).get(0).files;
                if (files === undefined) return;
                if (files.length == 0) return;
                var file = files[0];
                var name = file.name.split(".");
                if (name.length == 0) return;
                var extension = name[name.length-1].toLowerCase();
                if (extension === "json"){
                    reader.readAsText(file);
                } else {
                    globals.view.showWarningModal("Please load files in JSON format.")
                }
            });

            this.listenTo(this.model, "change:mode", this.updateUIForMode);
            this.updateUIForMode();
        },

        loadGeo: function(e){
            e.preventDefault();
            $("#jsonInput").click();
        },

        saveGeo: function(e){
            e.preventDefault();
            var json = {
                globals: globals.getSaveSettings(),
                mesh: _.omit(globals.mesh.toJSON(), ["meshOpacity", "showMesh"]),
                structure: {
                    nodes: globals.structure.getNodesJSON().nodes,
                    beams: globals.structure.getBeamsSaveJSON(),
                    membranes: globals.structure.getMembranesSaveJSON()
                }
            };
            var blob = new Blob([JSON.stringify(json, null, 2)], {type: "text/plain;charset=utf-8"});
            saveAs(blob, "HybridGeo.json");
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
            //if (globals.structure.get("numFixed") == 0) return 'You must define at least one fixed node before moving on to simulation and optimization, do this in "Boundaries Editing Mode".';
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