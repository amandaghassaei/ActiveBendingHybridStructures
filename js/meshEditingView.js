/**
 * Created by ghassaei on 11/3/16.
 */


function initMeshEditingView(globals){

    return new (Backbone.View.extend({

        el: "#meshEditingControls",

        events: {
            "click #uploadSTL": this.uploadSTL
        },

        initialize: function(){

            _.bindAll(this, "meshScaleChanged");

            var scale = this.model.get("scale");
            setSliderInput("#meshScaleX", scale.x, 0.0001, 20, 0.001, this.meshScaleChanged);
            setSliderInput("#meshScaleY", scale.y, 0.0001, 20, 0.001, this.meshScaleChanged);
            setSliderInput("#meshScaleZ", scale.z, 0.0001, 20, 0.001, this.meshScaleChanged);

            this.listenTo(this.model, "change:scale change:stl", this.setMeshSize);
            this.setMeshSize();
        },

        uploadSTL: function(e){
            e.preventDefault();
            //todo upload stl
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