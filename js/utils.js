/**
 * Created by ghassaei on 11/3/16.
 */

function setRadio(key, val){
    $(".radio>input[name=" + key + "][value=" + val + "]").prop("checked", true);
}

function setSliderInput(id, val, min, max, incr, callback){

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