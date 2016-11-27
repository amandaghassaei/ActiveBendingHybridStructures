/**
 * Created by ghassaei on 11/3/16.
 */

function setRadio(key, val, callback){
    $("input[name=" + key + "]").on('change', function() {
        var state = $("input[name="+key+"]:checked").val();
        callback(state);
    });
    $(".radio>input[name=" + key + "][value=" + val + "]").prop("checked", true);
}

function setLogSliderInput(id, val, min, max, incr, callback){

    var scale = (Math.log(max)-Math.log(min)) / (max-min);

    var slider = $(id+">div").slider({
        orientation: 'horizontal',
        range: false,
        value: (Math.log(val)-Math.log(min)) / scale + min,
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
        slider.slider('value', (Math.log(val)-Math.log(min)) / scale + min);
        callback(val, id);
    });
    $input.val(val);
    slider.on("slide", function(e, ui){
        var val = ui.value;
        val = Math.exp(Math.log(min) + scale*(val-min));
        $input.val(val.toFixed(4));
        callback(val, id);
    });

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


function setCheckbox(id, state, callback){
    var $input  = $(id);
    $input.on('change', function () {
        if ($input.is(":checked")) callback(true);
        else callback(false);
    });
    $input.prop('checked', state);
}


function setSlider(id, val, min, max, incr, callback, callbackOnStop){
    var slider = $(id).slider({
        orientation: 'horizontal',
        range: false,
        value: val,
        min: min,
        max: max,
        step: incr
    });
    slider.on("slide", function(e, ui){
        var val = ui.value;
        callback(val);
    });
    slider.on("slidestop", function(){
        var val = slider.slider('value');
        if (callbackOnStop) callbackOnStop(val);
    })
}

function setInput(id, val, callback, min, max){
    var $input = $(id);
    $input.change(function(){
        var val = $input.val();
        if ($input.hasClass("int")){
            if (isNaN(parseInt(val))) return;
            val = parseInt(val);
        } else {
            if (isNaN(parseFloat(val))) return;
            val = parseFloat(val);
        }
        if (min !== undefined && val < min) val = min;
        if (max !== undefined && val > max) val = max;
        $input.val(val);
        callback(val);
    });
    $input.val(val);
}