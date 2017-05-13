//地图基础要素添加
define(['jquery', 'ol', 'olkit'], function($, ol, olkit) {
	
	var map = new ol.Map({
    	controls : ol.control.defaults({zoom : false}),
        layers : [olkit.base.osmNormalLayer()],//基础图层
        target: document.getElementById('map'),
        view: olkit.base.view3857(),
        logo: false
    });

    //-------------地图工具-----------------//
    map.addControl(new ol.control.ScaleLine({units: 'metric'})); //比例尺
    //鼠标位置
    map.addControl(olkit.base.mousePosition({className: 'mouse-position-text'}));
    map.addControl(new ol.control.Zoom());  //添加缩放滑动控件  
    //---------------------------------------------//
    var drawLayers = olkit.survey.normalSurveyLayer();
    map.addLayer(drawLayers.layer);
    var draw = new ol.interaction.Draw({
    	source: drawLayers.source,
    	type: 'LineString'
    });
    draw.on('drawend',function(evt){
    	var wgs84Sphere = new ol.Sphere(6378137);
    	console.log(wgs84Sphere.haversineDistance([-2,0],[0,0]));
    	console.log(wgs84Sphere.haversineDistance([-2,0],[2,0]));
    	
    });
    map.addInteraction(draw);

    return{
        map: map
    };
    
});