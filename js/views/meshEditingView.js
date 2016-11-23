/**
 * Created by ghassaei on 11/3/16.
 */


function initMeshEditingView(globals){

    return new (Backbone.View.extend({

        el: "#meshEditingControls",

        events: {
            "click #uploadSTL": "uploadSTL"
        },

        initialize: function(){

            _.bindAll(this, "meshScaleChanged", "changeAutoDelete");

            setCheckbox("#autoDeleteGeo", globals.get("autoDeleteGeo"), this.changeAutoDelete);

            var scale = this.model.get("scale");
            setSliderInput("#meshScaleX", scale.x, 0.0001, 20, 0.001, this.meshScaleChanged);
            setSliderInput("#meshScaleY", scale.y, 0.0001, 20, 0.001, this.meshScaleChanged);
            setSliderInput("#meshScaleZ", scale.z, 0.0001, 20, 0.001, this.meshScaleChanged);

            this.listenTo(this.model, "change:scale change:stl", this.setMeshSize);
            this.setMeshSize();

            var reader = new FileReader();

            reader.addEventListener("load", function(){
                globals.mesh.loadSTL(reader.result);
            }, false);

            $("#fileInput").change(function(e){
                var files = $(e.target).get(0).files;
                if (files === undefined) return;
                if (files.length == 0) return;
                var file = files[0];
                var name = file.name.split(".");
                if (name.length == 0) return;
                var extension = name[name.length-1].toLowerCase();
                if (extension === "stl"){
                    reader.readAsDataURL(file);
                }
            });
        },

        changeAutoDelete: function(state){
            globals.set("autoDeleteGeo", state);
        },

        uploadSTL: function(e){
            e.preventDefault();
            $("#fileInput").click();
        },

        setMeshSize: function(){
            var $span = $("#meshSize");
            var size = this.model.getSize();
            $span.html(size.x.toFixed(2)  + " x " + size.y.toFixed(2) + " x " + size.z.toFixed(2));
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
            var scale = this.model.get("scale").clone();
            scale[key] = val;
            this.model.set("scale", scale);
        }

    }))({model:globals.mesh});
}