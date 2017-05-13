 !function (root,factory) {
    if (typeof define === "function" && define.amd) {
        // AMD模式
        define([ "ol" ], factory);
    } else if(typeof module === "object" && module.exports){
        // 全局模式
        module.exports = factory(ol);
    } else {
    	root.olkit = factory(ol);
    }
}(this,function (ol) {
	
	/**
	 * 移动中心点
	 * @param view 视图,
	 * @param coordinate 坐标
	 */
	function setCenter(view,coordinate){
		view.setCenter(coordinate);
	}

    /**
     * 图形适应视图
     * @param map: 地图,
     * @param geom: ol.geom
     */
    function viewFit(map,geom){
    	map.getView().fit(geom,map.getSize());
    }
    
	/**
     * wkt添加到地图
     * @param map 地图
     * @param source 数据源
     * @param wkt WKT文本
     * @returns
     */
    function addWkt(map,source,wkt){
        var geom = new ol.format.WKT().readGeometry(wkt);
        source.addFeature(new ol.Feature(geom));
        viewFit(map,geom);
    }
    
    /**
     * 获取范围内的分辨率数组
     * @param {
     *    proj:投影坐标系 e.g. default('EPSG:4326')
     *    tileSize: 瓦片大小 e.g. default([256,256]),
     *    arrayLength: 数组长度 e.g. default(21)
     * }
     */
    function getResolutions(options){
    	if(!options) options = {};
    	var proj = options.proj?options.proj:'EPSG:4326';
    	var tileSize = options.tileSize?options.tileSize:[256,256];
    	var extent = ol.proj.get(proj).getExtent();
    	var height = ol.extent.getHeight(extent);
    	var width = ol.extent.getWidth(extent);
    	var maxResolution = Math.max(width/size[0],height/size[1]);
    	
    	var length = options.arrayLength?options.arrayLength:21;
    	var resolutions = new Array(length+1);
    	for(var z=0;z<=length;z++) resolutions[z] = maxResolution/Math.pow(2, z);
    	return resolutions;
    }

	/**
     * 瓦片图层
     * @param options {
     *    projection: 投影 e.g. default('EPSG:4326'),
     *    opacity: 透明度 e.g. default(1),
     *    preload: 预加载层级 e.g. default(0),
     *    minZoom: source最小级别 e.g. default(0),
     *    maxZoom: source最大级别 e.g. default(18)
     * }
     * @return ol.layer
     */
	function tileLayer(options){
		if(!options) options = {};
		var projText = options.projection?options.projection:'EPSG:4326';
		var proj = ol.proj.get(projText);
		var extent = options.extent?options.extent:proj.getExtent();
		return new ol.layer.Tile({
    		opacity: options.opacity?options.opacity:1,
    	    preload: options.preload?options.preload:0,
    	    extent: extent,
            source: options.source
    	});
	}

	var coordinate = {
	    //定义一些常量
	    x_PI: 3.14159265358979324 * 3000.0 / 180.0,
	    PI: 3.1415926535897932384626,
	    a: 6378245.0,
	    ee: 0.00669342162296594323,
	   
	   /**
		* 国测局基础纬度坐标偏移
		* @param lng
		* @param lat
		* @return 
		*/
	    transformlat:function (lng, lat) {
		    var lat = +lat;
		    var lng = +lng;
		    var ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
		    ret += (20.0 * Math.sin(6.0 * lng * this.PI) + 20.0 * Math.sin(2.0 * lng * this.PI)) * 2.0 / 3.0;
		    ret += (20.0 * Math.sin(lat * this.PI) + 40.0 * Math.sin(lat / 3.0 * this.PI)) * 2.0 / 3.0;
		    ret += (160.0 * Math.sin(lat / 12.0 * this.PI) + 320 * Math.sin(lat * this.PI / 30.0)) * 2.0 / 3.0;
		    return ret;
	    },
	    
	   /**
	    * 国测局基础经度坐标偏移
	    * @param lng
	    * @param lat
	    * @return
	    */
	    transformlng:function(lng, lat) {
		    var lat = +lat;
		    var lng = +lng;
		    var ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
		    ret += (20.0 * Math.sin(6.0 * lng * this.PI) + 20.0 * Math.sin(2.0 * lng * this.PI)) * 2.0 / 3.0;
		    ret += (20.0 * Math.sin(lng * this.PI) + 40.0 * Math.sin(lng / 3.0 * this.PI)) * 2.0 / 3.0;
		    ret += (150.0 * Math.sin(lng / 12.0 * this.PI) + 300.0 * Math.sin(lng / 30.0 * this.PI)) * 2.0 / 3.0;
		    return ret;
	    },

	   /**
	    * 判断是否在国内，不在国内则不做偏移
	    * @param lng
	    * @param lat
	    * @return boolean
	    */
	    out_of_china:function(lng, lat) {
		    var lat = +lat;
		    var lng = +lng;
		    // 纬度3.86~53.55,经度73.66~135.05 
		    return !(lng > 73.66 && lng < 135.05 && lat > 3.86 && lat < 53.55);
	    },
	    
	   /**
	    * 百度坐标系 (BD-09) 与 火星坐标系 (GCJ-02)的转换
	    * 即 百度 转 谷歌、高德
	    * @param bd_lon
	    * @param bd_lat
	    * @returns []
	    */
	    bd09togcj02: function(bd_lon, bd_lat) {
		    var bd_lon = +bd_lon;
		    var bd_lat = +bd_lat;
		    var x = bd_lon - 0.0065;
		    var y = bd_lat - 0.006;
		    var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * this.x_PI);
		    var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * this.x_PI);
		    var gg_lng = z * Math.cos(theta);
		    var gg_lat = z * Math.sin(theta);
		    return [gg_lng, gg_lat];
	    },

	   /**
	    * 火星坐标系 (GCJ-02) 与百度坐标系 (BD-09) 的转换
	    * 即谷歌、高德 转 百度
	    * @param lng
	    * @param lat
	    * @returns []
	    */
	    gcj02tobd09: function(lng, lat) {
		    var lat = +lat;
		    var lng = +lng;
		    var z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * this.x_PI);
		    var theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * this.x_PI);
		    var bd_lng = z * Math.cos(theta) + 0.0065;
		    var bd_lat = z * Math.sin(theta) + 0.006;
		    return [bd_lng, bd_lat];
	    },

	   /**
	    * WGS84转GCj02
	    * @param lng
	    * @param lat
	    * @returns []
	    */
	    wgs84togcj02: function(lng, lat) {
		    var lat = +lat;
		    var lng = +lng;
		    if(this.out_of_china(lng, lat)) {
		        return [lng, lat]
		    }else {
		        var dlat = this.transformlat(lng - 105.0, lat - 35.0);
		        var dlng = this.transformlng(lng - 105.0, lat - 35.0);
		        var radlat = lat / 180.0 * this.PI;
		        var magic = Math.sin(radlat);
		        magic = 1 - this.ee * magic * magic;
		        var sqrtmagic = Math.sqrt(magic);
		        dlat = (dlat * 180.0) / ((this.a * (1 - this.ee)) / (magic * sqrtmagic) * this.PI);
		        dlng = (dlng * 180.0) / (this.a / sqrtmagic * Math.cos(radlat) * this.PI);
		        var mglat = lat + dlat;
		        var mglng = lng + dlng;
		        return [mglng, mglat]
		    }
	    },

	   /**
	    * GCJ02 转换为 WGS84
	    * @param lng
	    * @param lat
	    * @returns []
	    */
	    gcj02towgs84: function(lng, lat) {
		    var lat = +lat;
		    var lng = +lng;
		    if(this.out_of_china(lng, lat)) {
		        return [lng, lat]
		    }else {
		        var dlat = this.transformlat(lng - 105.0, lat - 35.0);
		        var dlng = this.transformlng(lng - 105.0, lat - 35.0);
		        var radlat = lat / 180.0 * this.PI;
		        var magic = Math.sin(radlat);
		        magic = 1 - this.ee * magic * magic;
		        var sqrtmagic = Math.sqrt(magic);
		        dlat = (dlat * 180.0) / ((this.a * (1 - this.ee)) / (magic * sqrtmagic) * this.PI);
		        dlng = (dlng * 180.0) / (this.a / sqrtmagic * Math.cos(radlat) * this.PI);
		        var mglat = lat + dlat;
		        var mglng = lng + dlng;
		        return [lng * 2 - mglng, lat * 2 - mglat]
		    }
	    }
	};
	
    var base = {
		/**
    	 * 4326标准wgs84视图
    	 * @param options {
    	 *    center 中心点 e.g. default([0,0]),
    	 *    zoom 初始放大等级 e.g. default(1),
    	 *    minZoom 默认最小等级 e.g. default(1),
    	 *    maxZoom 默认最大等级 e.g default(21),
    	 *    extent 范围 e.g. default([-180.0,-90.0,180.0,90.0])
    	 * }
    	 * @return ol.view
    	 */
		view4326 : function(options){
			if(!options) options = {};
			return new ol.View({
		        center: options.center?options.center:[0,0],
		        zoom: options.zoom?options.zoom:1,
		        minZoom: options.minZoom?options.minZoom:1,
		        maxZoom:options.maxZoom?options.maxZoom:21,
		        extent: options.extent?options.extent:[-180.0,-90.0,180.0,90.0],
		        projection: ol.proj.get('EPSG:4326')
			});
		},
		
		/**
    	 * 3857视图(等效于900913)
    	 * @param options {
    	 *    center 中心点 e.g. default([0,0]),
    	 *    zoom 初始放大等级 e.g. default(1),
    	 *    minZoom 默认最小等级 e.g. default(1),
    	 *    maxZoom 默认最大等级 e.g default(21),
    	 *    extent 范围 e.g. default([-180.0,-85.0511,180.0,85.0511])
    	 * }
    	 * @return ol.view
    	 */
    	view3857: function(options){
    		if(!options) options = {};
    		//解析中心点/范围投影坐标
    		var center = options.center?options.center:[0,0];
    		var extent = options.extent?options.extent:[-180.0,-85.0511,180.0,85.0511];
    		var ex1 = ol.proj.fromLonLat([extent[0],extent[1]]);
    		var ex2 = ol.proj.fromLonLat([extent[2],extent[3]]);
    		extent = [ex1[0],ex1[1],ex2[0],ex2[1]];
    		return new ol.View({
	            center: ol.proj.fromLonLat(center),
	            zoom: options.zoom?options.zoom:1,
	            minZoom: options.minZoom?options.minZoom:1,
	            maxZoom: options.maxZoom?options.maxZoom:21,
	            extent: extent,
	            projection: ol.proj.get('EPSG:3857')
    		});
    	},
    	
    	
        /**
         * 天地图矢量图层
         * @return veclayer ol.layer
         */
        tiandituVecLayer: function(options){
        	if(!options) options = {};
        	var source = new ol.source.XYZ({
        		projection:ol.proj.get('EPSG:4326'),
        		minZoom: options.minZoom?options.minZoom:0,
                maxZoom: options.maxZoom?options.maxZoom:18,
        		url:"http://t{0-7}.tianditu.com/DataServer?T=vec_c&x={x}&y={y}&l={z}"
            });
        	options.source = source;
        	return tileLayer(options);
        },
        
        /**
         * 天地图标注图层
         * @return cvalayer ol.layer
         */
        tiandituCvaLayer: function(options){
        	if(!options) options = {};
        	var source = new ol.source.XYZ({
        		projection: ol.proj.get('EPSG:4326'),
        		minZoom: options.minZoom?options.minZoom:0,
        		maxZoom: options.maxZoom?options.maxZoom:18,
        		url:"http://t{0-7}.tianditu.com/DataServer?T=cva_c&x={x}&y={y}&l={z}"
            });
        	options.source = source;
        	return tileLayer(options);
        },
        
        /**
         * 天地图影像图层
         * @return imglayer ol.layer
         */
        tiandituImgLayer: function(options){
        	if(!options) options = {};
            var source = new ol.source.XYZ({
        		projection:ol.proj.get('EPSG:4326'),
        		minZoom: options.minZoom?options.minZoom:0,
                maxZoom: options.maxZoom?options.maxZoom:18,
        		url:"http://t{0-7}.tianditu.cn/img_c/wmts?service=wmts&request=GetTile&version=1.0.0" +
        		"&LAYER=img&tileMatrixSet=c&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles"
            });
            options.source = source;
        	return tileLayer(options);
        },
        
        /**
         * 天地图影像标注图层
         * @return cialayer ol.layer
         */
        tiandituCiaLayer: function(options){
        	if(!options) options = {};
            var source = new ol.source.XYZ({
        		projection:ol.proj.get('EPSG:4326'),
        		minZoom: options.minZoom?options.minZoom:0,
                maxZoom: options.maxZoom?options.maxZoom:18,
        		url:"http://t{0-7}.tianditu.cn/cia_c/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia" +
        		"&tileMatrixSet=c&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles"
         	});
            options.source = source;
        	return tileLayer(options);
        },
        
        /**
         * 谷歌矢量图层
         * @return ol.layer
         */
        googleVecLayer: function(options){
        	if(!options) options = {};
        	var source = new ol.source.XYZ({
        		projection: ol.proj.get('EPSG:3857'),
        		minZoom: options.minZoom?options.minZoom:0,
                maxZoom: options.maxZoom?options.maxZoom:18,
        		url:"http://mt{0-3}.google.cn/vt/?lyrs=m&x={x}&y={y}&z={z}"
        	});
        	options.source = source;
        	options.projection = 'EPSG:3857';
        	return tileLayer(options);
        },
        
        /**
         * 谷歌地形图层
         * @return ol.layer
         */
        googleTerLayer: function(options){
        	if(!options) options = {};
        	var source = new ol.source.XYZ({
        		projection: ol.proj.get('EPSG:3857'),
        		minZoom: options.minZoom?options.minZoom:0,
                maxZoom: options.maxZoom?options.maxZoom:18,
        		url:"http://mt{0-3}.google.cn/vt/?lyrs=t&x={x}&y={y}&z={z}"
        	});
        	options.source = source;
        	options.projection = 'EPSG:3857';
        	return tileLayer(options);
        },
        
        /**
         * 谷歌影像图层
         * @return ol.layer
         */
        googleImgLayer: function(options){
        	if(!options) options = {};
        	var source = new ol.source.XYZ({
        		projection: ol.proj.get('EPSG:3857'),
        		minZoom: options.minZoom?options.minZoom:0,
                maxZoom: options.maxZoom?options.maxZoom:18,
        		url:"http://mt{0-3}.google.cn/vt/?lyrs=s&x={x}&y={y}&z={z}"
        	});
        	options.source = source;
        	options.projection = 'EPSG:3857';
        	return tileLayer(options);
        },
        
        /**
         * 谷歌标注图层
         * @return ol.layer
         */
        googleCvaLayer: function(options){
        	if(!options) options = {};
        	var source = new ol.source.XYZ({
        		projection: ol.proj.get('EPSG:3857'),
        		minZoom: options.minZoom?options.minZoom:0,
                maxZoom: options.maxZoom?options.maxZoom:18,
        		url:"http://mt{0-3}.google.cn/vt/?lyrs=h&x={x}&y={y}&z={z}"
        	});
        	options.source = source;
        	options.projection = 'EPSG:3857';
        	return tileLayer(options);
        },
        
        /**
         * OSM标准图层
         * @return ol.layer
         */
        osmNormalLayer: function(options){
        	if(!options) options = {};
        	var source = new ol.source.OSM({
        		minZoom: options.minZoom?options.minZoom:0,
                maxZoom: options.maxZoom?options.maxZoom:18
        	});
        	options.source = source;
        	options.projection = 'EPSG:3857';
        	return tileLayer(options);
        },
        
        /**
         * OSM地形图层
         * @return ol.layer
         */
        osmTerrainLayer: function(options){
        	if(!options) options = {};
        	var source = new ol.source.OSM({
        		minZoom: options.minZoom?options.minZoom:0,
                maxZoom: options.maxZoom?options.maxZoom:18,
                url: "http://{a-c}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png"
        	});
        	options.source = source;
        	options.projection = 'EPSG:3857';
        	return tileLayer(options);
        },
        
        /**
         * OSM交通图层
         * @return ol.layer
         */
        osmTransportLayer: function(options){
        	if(!options) options = {};
        	var source = new ol.source.OSM({
        		minZoom: options.minZoom?options.minZoom:0,
                maxZoom: options.maxZoom?options.maxZoom:18,
                url: "http://{a-c}.tile.thunderforest.com/transport/{z}/{x}/{y}.png"
        	});
        	options.source = source;
        	options.projection = 'EPSG:3857';
        	return tileLayer(options);
        },
//        
//        /**
//         * 腾讯标准图层
//         * @return ol.layer
//         */
//        tencentNormalLayer: function(options){
//        	if(!options) options = {};
//        	var source = new ol.source.TileImage({
//        		projection:ol.proj.get('EPSG:3857'),
//        		tileGrid: new ol.tilegrid.createXYZ(),
//        		tileUrlFunction: function(tileCoord){
//        			var z = tileCoord[0];
//        			var x = tileCoord[1];
//        			var y = -tileCoord[2];
//        			var yy = Math.pow(2, z) - y;
//        			var url = z+"/"+Math.floor(x/16.0)+"/"   
//        			    + Math.floor(yy / 16.0)+ "/" + x+ "_"   
//        			    + yy+ ".jpg";
//        			return "http://p"+Math.round(Math.random()*3)+".map.gtimg.com/demTiles/"+url;
//        		}
//        	});
//        	options.source = source;
//        	return tileLayer3857(options);
//        },
//        
        /**
         * 腾讯地形图层
         * @return ol.layer
         */
        tencentTerrainLayer: function(options){
        	if(!options) options = {};
        	var source = new ol.source.TileImage({
        		projection:ol.proj.get('EPSG:3857'),
        		tileGrid: new ol.tilegrid.createXYZ(),
        		tileUrlFunction: function(tileCoord){
        			var z = tileCoord[0];
        			var x = tileCoord[1];
        			var y = -tileCoord[2];
        			var yy = Math.pow(2, z) - y;
        			var url = z+"/"+Math.floor(x / 16.0)+"/"   
        			    + Math.floor(yy / 16.0)+ "/" + x+ "_"   
        			    + yy+ ".jpg";
        			return "http://p"+Math.round(Math.random()*3)+".map.gtimg.com/demTiles/"+url;
        		}
        	});
        	options.source = source;
        	options.projection = 'EPSG:3857';
        	return tileLayer(options);
        },
        

        /**
         * 腾讯影像图层
         * @return ol.layer
         */
        tencentImgLayer: function(options){
        	if(!options) options = {};
        	var source = new ol.source.XYZ({
        		projection:ol.proj.get('EPSG:3857'),
//        		tileGrid: new ol.tilegrid.createXYZ(),
        		tileUrlFunction: function(tileCoord){
        			var z = tileCoord[0];
        			var x = tileCoord[1];
        			var y = -tileCoord[2];
        			var yy = Math.pow(2, z) - y;
        			var url = z+"/"+Math.floor(x / 16.0)+"/"   
        			    + Math.floor(yy / 16.0)+ "/" + x+ "_"   
        			    + yy+ ".jpg";
        			return "http://p"+Math.round(Math.random()*3)+".map.gtimg.com/sateTiles/"+url;
        		}
        	});
        	options.source = source;
        	options.projection = 'EPSG:3857';
        	return tileLayer(options);
        },
        
        /**
         * boxing矢量加载图层
         * @param {
         * 	   proj: 投影 e.g. defaults('EPSG:4326'),
         * 
         * }
         */
        dynamicsVector: function(options){
        	var projText = options.proj?options.proj:'EPSG:4326';
        	var proj = ol.proj.get(projText);
        	var defaultExtent = proj.getExtent();
        	var source = new ol.source.Vector({
				loader: function(extent, resolution, projection) {  //加载函数  
		    		//过滤范围
		    		if(extent[0]>0&&extent[1]>0&&extent[2]>0&&extent[3]>0&&extent[0]<180&&extent[1]<90&&extent[2]<180&&extent[3]<90){
		    			$.ajax({
		                    url: '${base}/gis/map/geoserverExtent',
		                    data: {'layer':'sugar:base_land','low':extent[0]+'%20'+extent[1],'up':extent[2]+'%20'+extent[3],'status':landStatus},
		                    type : 'POST', 
		                    success: function(rs) {
		                        if(rs.code=="SUCCESS"){
		                        	var features = new ol.format.GeoJSON().readFeatures(rs.data);
		                              if (features.length > 0) {
		                            	  for(var i=0;i<features.length;i++){
		                            		  var id = features[i].getId().split('.')[1];
		                            		  if(landSource.getFeatureById(id)==null){ //不存在
		                                		  features[i].set('id',id);
		                                		  features[i].set('name',features[i].getProperties().no);
		                                		  if(id==landid) continue;
		                               	       	  landSource.addFeature(features[i]); 
		                            		  }
		                            	  }
		                              }
		                        }
		                    },
		                    error: true
		                });	
		    		}
		    	},
		    	strategy: ol.loadingstrategy.bbox,
				wrapX:false
			})
        },
        
        /**
         * 聚集图层+真实图层(样式请自行修改)
         * @param middleResolution: 限制分辨率 required
         * @param {
         *    minResolution: 最小分辨率 e.g. default(undefined),
         *    maxResolution: 最大分辨率 e.g. default(undefined),
         *    distance: 像素距离 e.g. default(45),
         *    ratio: 系数 e.g. default(0.2),
         *    radix: 基数 e.g. default(8),
         *    limit: 最大像素限制 e.g. default(120),
         *    textKey: 保存在feature内显示文字的key e.g.feature.get('no'),所以填'no'
         * }
         * @return {
         *    source：数据源，可在此添加矢量数据,
         *    cluLayer: 聚集图层,
         *    realLayer: 真实图层
         * }
         */
        clusterLayers: function(middleResolution,options){
        	//基础数据源
            var source = new ol.source.Vector({wrapX:false});
	        //聚集伪图层
            var cluLayer =  new ol.layer.Vector({
	       	    minResolution: middleResolution,
	       	    maxResolution: options.maxResolution?options.maxResolution:undefined,
	        	source: new ol.source.Cluster({
	     	        distance: options.distance,
	     	        source: source,
	     	        geometryFunction: function(feature){
	     	    	    var geom = feature.getGeometry();
	     		   	    if(geom instanceof ol.geom.LineString) return new ol.geom.Point(geom.getFirstCoordinate());
	     		   	    if(geom instanceof ol.geom.Polygon) return geom.getInteriorPoint();
	     		   	    if(geom instanceof ol.geom.MultiPolygon){
	     		   		    var temp_points = geom.getInteriorPoints().getPoints();
	     		   		    var avg_x = 0;var avg_y = 0;
	     		   		    var po_len = temp_points.length;
	     		   		    for(var j=0;j<po_len;j++){
	     		   			    var coor = temp_points[j].getCoordinates();
	     		   			    avg_x += coor[0];avg_y += coor[1];
	     		   		    }
	     		   		    return new ol.geom.Point([avg_x/po_len,avg_y/po_len]);
	     		   		}
	     	        }
		     	}),
	            style: function(features) {
	                var size = features.get('features').length;
	                var radix = options.radix?options.radix:8;
	                var ratio = options.ratio?options.ratio:0.2;
	                var radius = size * ratio + radix;
	                var limit = options.limit?options.limit:120;
	                var style = new ol.style.Style({
	                    image: new ol.style.Circle({
		                    radius: radius>limit?limit:radius,
		                    stroke: new ol.style.Stroke({color:'#000'}),
		                    fill: new ol.style.Fill({color:'#3399CC'})
	                    }),
		                text: new ol.style.Text({
		                    text: size.toString(),
		                    fill: new ol.style.Fill({color: '#fff'})
		                })
	                });
	                return style;
	             }
	        });
	        
	        //真展示图层
	        var realLayer = new ol.layer.Vector({
	        	maxResolution: middleResolution,
	       	    minResolution: options.minResolution?options.minResolution:undefined,
		    	source: source,
		    	style: function(feature,resolution){
		    		var key = options.textKey?options.textKey:null;
		    		var text = feature.get(key)?feature.get(key):null;
		    		return new ol.style.Style({
		    			stroke: new ol.style.Stroke({color:'#000'}),
		    			fill: new ol.style.Fill({color:'#3399CC'}), //填充
		    			text:new ol.style.Text({text:text?text.toString():''})
	   	        	});
		    	}
		    });
	        
	        return {
	        	source: source,
	        	cluLayer: cluLayer,
	        	realLayer: realLayer
	        }
        },
    
        
        /**
         * 鼠标位置完美控件(差别不大无需进行投影变换)
         * @param {
         *    target: DOM元素 e.g. default(undefined),
         *    className: 样式类 e.g. default(undefined),
         *    flag_radian: 是否使用弧度制,
         *    format: 格式(必需带{x}/{y}) e.g. default(undefined),
         *    digit: 小数位数 e.g. default(1)
         * }
         */
        mousePosition: function(options){
        	if(!options) options = {};
        	var coorFunction = null;
        	var digit = options.digit?options.digit:1;
        	if(options.flag_radian){
        		coorFunction = function(coordinate){
        			return ol.coordinate.toStringHDMS(coordinate,digit);
        		};
        	}else{
        		coorFunction = function(coordinate){
        			return ol.coordinate.toStringXY(coordinate,digit);
        		};
        	}
        	
        	if(options.format){
        		coorFunction = function(coordinate){
        			return ol.coordinate.format(coordinate,options.format,digit);
        		}; 
        	}
        	
        	return new ol.control.MousePosition({
        		className: options.className?options.className:undefined,
        		projection: ol.proj.get('EPSG:4326'),
        		undefinedHTML:'&nbsp;',
        		target: options.target?options.target:undefined,
        		coordinateFormat: coorFunction
        	});
        },
        
        /**
         * 矩形绘制控件
         */
        rectangleDraw:function(){
        	return new ol.interaction.Draw({
       			source: olkit.searSource,
       			type: 'LineString',
       			maxPoints: 2,
       			/* condition: ol.events.condition.mouseOnly,
       			freehandCondition: ol.events.condition.noModifierKeys, */
       			geometryFunction: function(coor,geometry){
       				if(!geometry) geometry = new ol.geom.Polygon(null); //多边形
   					var start = coor[0]; //起点
   					var end = coor[1];  //终点
   					geometry.setCoordinates([
   					    [start, [start[0], end[1]], end, [end[0], start[1]], start]
   					]);
   					return geometry;
       			}
       		});
        },
        
        /**
         * select样式选择(样式请自行修改)
         * @param eventType: select触发事件 e.g. default('pointermove'),
         * }
         */
        styleChange:function(eventType){
        	if(!options) options = {};
        	var select = new ol.interaction.Select({
                condition: function(evt) {
                	var eventType = eventType?eventType:'pointermove';
                    return evt.originalEvent.type == eventType;
                },
                style: function(feature,resolution){
                	var geo = feature.getGeometry();
               		if(geo instanceof ol.geom.Point){
               			var style;
        	   			if(feature.get('id')){
        	   				style = new ol.style.Style({
            	   				image: new ol.style.Icon({
            	                    anchor: [0.48,1],
            	                    src: './position2.png'
            	                 }),
            	                 text: new ol.style.Text({
            	                	text:feature.get('id').toString(),
            	                	font:'normal normal bold 12px arial,sans-serif',
            	                	offsetY:-30,
            	                	fill:new ol.style.Fill({color:'#ffffff'})
            	                 }) 
            	            });
        	   			}else{
        	   				style = new ol.style.Style({
        		    			image: new ol.style.Circle({radius:7,   //填充图案样式
        		    				fill: new ol.style.Fill({color:'#ffcc33'})
        		    			})
            	            });
        	   			}
        	   			return style;
               		}
               		if(geo instanceof ol.geom.LineString){
               			return new ol.style.Style({
               				stroke: new ol.style.Stroke({
        	    				color:'rgb(165,24,27)',
        	    				width:3,
        	    				lineDash:[10,10]
        	    			}) //边界
               			});
               		}
               		if(geo instanceof ol.geom.Polygon || geo instanceof ol.geom.MultiPolygon){
               			return new ol.style.Style({
               	 			fill: new ol.style.Fill({color:'rgba(0,0,0,0.6)'}), //填充
               	 			stroke: new ol.style.Stroke({
               	 				color:'#a5181b',
               	 				width:3,
               	 				lineDash:[10,10]
               	 			}) //边界
               	 		});
               		}
                }
            });
        	return select;
        },
        
        /**
         * 滑行定位
         * @param map: 地图
         * @param coordinate: 坐标
         */
        panToPosition: function(map,coordinate) {
            var view = map.getView();
            var pan = ol.animation.pan({
                duration: 500,
                source: view.getCenter(),
                start: +new Date()
            });
            map.beforeRender(pan);
            setCenter(view,coordinate);
        }
    };
    
    var survey = {

		/**
		 * 通用型测量图层
		 */
    	normalSurveyLayer:function(){
			//绘制数据源
		    var source = new ol.source.Vector({wrapX:false});
		    //实例化一个绘制图层
		 	var layer = new ol.layer.Vector({
	    		source: source,
	    		style: function(feature){
	    			var geometry = feature.getGeometry();
	    	        var styles = [
	    	           new ol.style.Style({
	                   		stroke: new ol.style.Stroke({
	                     	    color: 'blue',
	                     	    width: 2
	                   		}),
	                   		fill: new ol.style.Fill({
	                     	    color: 'rgba(0, 0, 255, 0.1)'
	                   		})
	                 	})
	    	        ];
	    	        if(geometry instanceof ol.geom.LineString){
	    	        	var coordinates = geometry.getCoordinates();
	    	        	for(var i=styles.length-1;i<coordinates.length;i++){
		    	        	styles.push(new ol.style.Style({
			    	            geometry: new ol.geom.Point(coordinates[i]),
			    	            image: new ol.style.Circle({
		                         	radius: 10,
		                         	fill: new ol.style.Fill({color:'orange'})
		                        }),
		                   	    text:new ol.style.Text({text:(i+1).toString()})
			    	         }));
		    	        }
	    	        }
	    	        return styles;
	    	    }
		 	});
		 	return {
		 		source: source,
		 		layer: layer
		 	}
		},
		
		/**
		 * 判断两条线段是否相交 intersection 相交点坐标
		 * @param a/b 线段1两端点
		 * @param c/d 线段2两端点
		 */
		intersect: function(a,b,c,d){
			//相交点x
			var x = ((b[0] - a[0]) * (c[0] - d[0]) * (c[1] - a[1]) - 
			c[0] * (b[0] - a[0]) * (c[1] - d[1]) + a[0] * (b[1] - a[1]) * (c[0] - d[0])) / 
			((b[1] - a[1]) * (c[0] - d[0]) - (b[0] - a[0]) * (c[1] - d[1]));
			
			//相交点y
			y = ((b[1] - a[1]) * (c[1] - d[1]) * (c[0] - a[0]) - c[1]
			* (b[1] - a[1]) * (c[0] - d[0]) + a[1] * (b[0] - a[0]) * (c[1] - d[1]))
			/ ((b[0] - a[0]) * (c[1] - d[1]) - (b[1] - a[1]) * (c[0] - d[0]));
			
			//全部一正一反，相乘为负
			if ((x - a[0]) * (x - b[0]) <= 0
			&& (x - c[0]) * (x - d[0]) <= 0
			&& (y - a[1]) * (y - b[1]) <= 0
			&& (y - c[1]) * (y - d[1]) <= 0) {
				return [x,y]; //相交
			}else {
				return null;
			}
		},
    	
        /**
         * 计算线段长度
         * @param line: 线段 e.g. ol.geom.LineString
         * @param {
         * 	   sphereRadius: 球体半径 e.g. default(6378137m),
         * 	   proj: 投影 e.g. default('EPSG:4326'), 
         * 	   flag_text：是否用text返回 e.g. default(undefined)
         * }
         * @return 长度
         */
  	    formatLength: function(line,options) {
  	    	if(!options) options = {};
            var length = 0; //记录长度
            var projText = options.proj?options.proj:'EPSG:4326';
  	    	var proj = ol.proj.get(projText);
    		var radius = options.sphereRadius?options.sphereRadius:6378137;
  	    	var wgs84Sphere = new ol.Sphere(radius);
  	    	
	    	if(line instanceof ol.geom.LineString){ //单linestring
	    		var coordinates = line.getCoordinates();
	    		
	    		if(proj.getMetersPerUnit()==1){ //米为单位,即投影
	            	for(var i=0;i<coordinates.length;i++){
	            		coordinates[i] = ol.proj.toLonLat(coordinates[i],projText);
	            	}
	            }
	    		for (var i=0,ii=coordinates.length-1;i<ii;++i) {
	    			length += wgs84Sphere.haversineDistance(coordinates[i],coordinates[i+1]);
	            }
	    	}else{ //多linestring
	    		var lineStrings = line.getLineStrings();
	    		for(var i=0,len=lineStrings.length;i<len;i++){
	    			var coordinates = lineStrings[i].getCoordinates();
		    		if(proj.getMetersPerUnit()==1){ //米为单位,即投影
		            	for(var j=0;j<coordinates.length;j++){
		            		coordinates[j] = ol.proj.toLonLat(coordinates[j],projText);
		            	}
		            }
		    		for (var k=0,kk=coordinates.length-1;k<kk;++k) {
		                length += wgs84Sphere.haversineDistance(coordinates[k],coordinates[k+1]);
		            }
	    		}
  	    	}
            
            

            if(options.flag_text){
            	var output;
      	        if(length>100) output=(Math.round(length/1000*100)/100)+' '+'km';
      	        else output=(Math.round(length*100)/100)+' '+'m';
      	        return output;
            }

  	        return length;
  	    },
  	    
  	    /**
         * 计算面积
         * @param poly: 多边形/多边形集 e.g. ol.geom.Polygon/ol.geom.MultiPolygon
         * @param {
         * 	   sphereRadius: 球体半径 e.g. default(6378137m),
         *     proj: 投影 e.g. default('EPSG:4326'),
         * 	   flag_text：是否用text返回 e.g. default(undefined)
         * }
         * @return 面积
         */
  	    formatArea: function(poly,options) {
  	    	if(!options) options = {};
  	    	var area = 0;
  	    	var projText = options.proj?options.proj:'EPSG:4326';
  	    	var proj = ol.proj.get(projText);
    		var radius = options.sphereRadius?options.sphereRadius:6378137;
  	    	var wgs84Sphere = new ol.Sphere(radius);
  	    	
	    	if(poly instanceof ol.geom.Polygon){ //单polygon
	    		//外环面积计算
	    		var coordinates = poly.getLinearRing(0).getCoordinates();
	    		if(proj.getMetersPerUnit()==1){ //投影坐标系转化
	            	for(var i=0;i<coordinates.length;i++){
	            		coordinates[i] = ol.proj.toLonLat(coordinates[i],projText);
	            	}
	  	    	}
	            area = Math.abs(wgs84Sphere.geodesicArea(coordinates));
	            
	            //内环面积计算
	            var len = poly.getLinearRingCount();
	            if(len>1){ //有内部环
	            	for(var i=1;i<len;i++){
	            		var coors = polygon.getLinearRing(i).getCoordinates();
	            		if(proj.getMetersPerUnit()==1){ //投影坐标系转化
	    	            	for(var i=0;i<coors.length;i++){
	    	            		coors[i] = ol.proj.toLonLat(coors[i],projText);
	    	            	}
	    	  	    	}
	            		area -= Math.abs(wgs84Sphere.geodesicArea(coors));
	            	}
	            }
	    	}else{ //多polygon
	    		var polygons =poly.getPolygons();
	    		for(var i=0,len=polygons.length;i<len;i++){
	    			//外环面积计算
		    		var coordinates = polygons[i].getLinearRing(0).getCoordinates();
		    		if(proj.getMetersPerUnit()==1){ //投影坐标系转化
		            	for(var j=0;j<coordinates.length;j++){
		            		coordinates[j] = ol.proj.toLonLat(coordinates[j],projText);
		            	}
		  	    	}
		            area = Math.abs(wgs84Sphere.geodesicArea(coordinates));
		            
		            //内环面积计算
		            var len = polygons[i].getLinearRingCount();
		            if(len>1){ //有内部环
		            	for(var j=1;j<len;j++){
		            		var coors = polygons[i].getLinearRing(j).getCoordinates();
		            		if(proj.getMetersPerUnit()==1){ //投影坐标系转化
		    	            	for(var k=0;k<coors.length;k++){
		    	            		coors[k] = ol.proj.toLonLat(coors[k],projText);
		    	            	}
		    	  	    	}
		            		area -= Math.abs(wgs84Sphere.geodesicArea(coors));
		            	}
		            }
	    		}
  	    	}

    		if(options.flag_text){
            	var output;
      	        if(area>100000) output=(Math.round(area/1000000*100)/100)+' '+'km²';
      	        else output=(Math.round(area*100)/100)+' '+'m²';
      	        return output;
            }
    		return area;
	    },	
    		
		/**
		 * 位置定位
		 * @param source: 数据源
		 * @param coordinate: 坐标
		 * @param view: 视图
		 * @param {
		 *    flag_center: 是否置于视图中心
		 * }
		 */
		yourPosition: function(source,coordinate,view,options){
			if(!options) options = {};
			var lastFeature = source.getFeatureById('your_site');
			if(lastFeature) source.removeFeature(lastFeature);
			var point = new ol.geom.Point(coordinate);
			var feature = new ol.Feature({geometry:point});
			feature.setId('your_site');
			source.addFeature(feature);
			if(flag_center) setCenter(view,coordinate);
		},
		
	   /**
	    * 传坐标点测量开启
	    * @param source: 数据源
	    * @param {
	    *    flag_ring: 是否测内环 e.g. default(false),
	    * }
	    * @return boolean
	    */
		surveyStart: function(source,options){
			if(!options) options = {};
			var flag_ring = options.flag_ring?options.flag_ring:false;
			if(flag_ring){ //测内部环
				if(source.getFeatureById('inter_ring')==null){
					var feature = new ol.Feature(new ol.geom.LineString([],'XY'));
					feature.setId('inter_ring'); 
					source.addFeature(feature);
					return true;
				}
			}else{ //测外部环
				if(source.getFeatureById('outer_ring')==null){
					var feature = new ol.Feature(new ol.geom.LineString([],'XY'));
					feature.setId('outer_ring'); 
					source.addFeature(feature);
					return true;
				}
			}
			return false;
		},
		
		/**
		 * 添加当前点到图形中
		 * @param source: 数据源
		 * @param coordinate: 坐标
		 * @param {
		 *    flag_ring: 是否测内环 e.g. default(false),
		 * }
		 * @return boolean
		 */
		addPositionToSurvey: function(source,coordinate,options){
			if(!options) options = {};
			var flag_ring = options.flag_ring?options.flag_ring:false;
			if(flag_ring){
				var inRing = source.getFeatureById('inter_ring');
				if(inRing){
					inRing.getGeometry().appendCoordinate(coordinate);
					return true;
				}
			}else{ //外部环增加点
				var outRing = source.getFeatureById('outer_ring');
				if(outRing){
					outRing.getGeometry().appendCoordinate(coordinate);
					return true;
				}
			}
			return false;
		},

		/**
		 * 撤销上一点
		 * @param source: 数据源
		 * @param view: 视图
		 * @param {
		 *    flag_ring: 是否内环 e.g. default(false) 
		 * }
		 * @returns boolean
		 */
		removeLastInSurvey: function(source,view,options){
			if(!options) options = {};
			var flag_ring = options.flag_ring?options.flag_ring:false;
			if(flag_ring){ //内环
				var inRing = source.getFeatureById('inter_ring');
				if(inRing){
					var line = inRing.getGeometry();
					var coors = line.getCoordinates();
					coors.pop();
					line.setCoordinates(coors, 'XY');
					setCenter(view,coors[coors.length-1]);
					return true;
				}
			}else{ //外环
				var outRing = source.getFeatureById('outer_ring');
				if(outRing){
					var line = outRing.getGeometry();
					var coors = line.getCoordinates();
					coors.pop();
					line.setCoordinates(coors, 'XY');
					setCenter(view,coors[coors.length-1]);
					return true;
				}
			}
			return false;
		},
		
		/**
		 * 测量闭合
		 * @param source: 数据源
		 * @param map: 地图
		 * @param flag_line: 是否线 e.g. default(false)
		 * @return boolean
		 */
		surveyEnd: function(source,map,flag_line){
			var outRing = source.getFeatureById('outer_ring');
			var inRing = source.getFeatureById('inter_ring');
			if(outRing){
				var line = outRing.getGeometry();
				source.removeFeature(outRing);
				
				//属于测量线时的处理
				if(flag_line){
					var theLine = new ol.Feature(line);
					theLine.setId('line');
					source.addFeature(theLine);
					viewFit(map,line);
			        return true;
				}
				
				var first = line.getFirstCoordinate(); //获取第一点
				line.appendCoordinate(first);
				var polygon = new ol.geom.Polygon([line.getCoordinates()],'XY');
				var feature = new ol.Feature(polygon);
		        feature.setId('polygon');
		        source.addFeature(feature);
		        viewFit(map,polygon);
		        return true;
			}else if(inRing){ //内部环加入外部环内
				var line = inRing.getGeometry();
				source.removeFeature(inRing);
				var first = line.getFirstCoordinate(); //获取第一点
				line.appendCoordinate(first);
				var ring_poly = new ol.geom.Polygon([line.getCoordinates()],'XY');
				
				//拿到之前的图形加入新的环
				var polygon = source.getFeatureById('polygon');
				//后台JTS进行求交
				var new_poly = android.getPolyWithInteraction(new ol.format.WKT().writeFeature(polygon),new ol.format.WKT().writeGeometry(ring_poly));
				if(new_poly){
					source.removeFeature(polygon);
		            var feature = new ol.format.WKT().readFeature(new_poly);
		            feature.setId('polygon');
		            source.addFeature(feature);
		            viewFit(map,feature.getGeometry());
		            return true;
				}
			}
			return false;
		},
		
		/**
		 * 获取测量结果
		 * @param source 数据源
		 * @returns
		 */
		getSurveyResult:function(source){
			var poly = source.getFeatureById('polygon');
			var line = source.getFeatureById('line');
			var wkt;
			var area;
			if(poly){
				wkt = new ol.format.WKT().writeFeature(poly);
				area = olkit.formatArea(poly.getGeometry());
			}
			if(line){
				wkt =  new ol.format.WKT().writeFeature(line);
				area = olkit.formatLength(line.getGeometry());
			}
			return {
				wkt:wkt,
				area: area
			};
		}
    };
    
    var geoserver = {
    		/**
    		 * 改变数字格式
    		 * @param str 所载入的数字
    		 * @param len 需要的长度
    		 * @returns 返回一个定义长度的数字字符串
    		 */
    		numberFix: function(str,len){
    			var temp = "000000" + str.toString();
    			return temp.substr(temp.length-len,len);	
    		},

    		/**
    		 * 计算geoserver划分文件数
    		 * @param maxZoom 最大级别
    		 * @returns 保存文件数的数组
    		 */
    		calFileNum: function(maxZoom){
    			var fileDelta = new Array(maxZoom+1);//每个文件夹的边数组
    			for(var i=0;i<=maxZoom;i++){
    				if(i%2==0) fileDelta[i] = Math.pow(2,i+2); //偶数
    				else fileDelta[i] = fileDelta[i-1]; //奇数
    			}
    			return fileDelta;
    		},

    		/**
    		 * 本地瓦片地图
    		 * @param fatherUrl 父路径
    		 * @param suffix 后缀
    		 * @param {
    		 *    projection: 投影 e.g. default('EPSG:4326'),
    		 *    extent: 范围 e.g. default(proj.getExtent),
    		 *    tileSize: 瓦片大小 e.g. default([256,256]),
    		 *    arrayLength: 数组长度 e.g. default(21)
    		 * }
    		 */
    		tileLayer: function(fatherUrl,suffix,options){
    			if(!options) options = {};
    			var url = fatherUrl+'/{z}/{f}/{x}_{y}.'+suffix; //初步的url
    			var projText = options.projection?options.projection:'EPSG:4326';
    			var proj = ol.proj.get(projText);
    			var extent = options.extent?options.extent:proj.getExtent();
    			var arrayLength = options.arrayLength?options.arrayLength:21;
    		    var resolutions = getResolutions({
    		    	proj: projText,
    		    	tileSize: options.tileSize?options.tileSize:[256,256],
    		    	arrayLength: arrayLength
    		    });
    			//-------------------调用方法--------------------------------//
    			var fileDel = this.calFileNum(arrayLength); //获取文件内含图像个数数组
    			var zText = projText.split(':')[1]; 
    			//定义数据源
    			var source = new ol.source.TileImage({
    				projection: proj,
    				tileGrid: new ol.tilegrid.TileGrid({
    					origin: extent.getBottomLeft(),//ol.extent.getBottomLeft() Geoserver瓦片原点在左下角
    					resolutions: resolutions,
    					tileSize: tileSize
    				}),
    				tileUrlFunction:function(tileCoord){
    					var z = tileCoord[0];
    					var x = tileCoord[1];
    					var y = tileCoord[2];
    					var tempFile = Math.sqrt(fileDel[z]); //边数
    					var tryx = Math.floor((x+1)/tempFile); //x所在文件列
    					var tryy = Math.ceil((y+1)/tempFile)-1; //y所在文件行
						if(z<12){ //12级以下(文件夹2位，行列4位)
							var file = this.numberFix(tryx,2) + '_' + this.numberFix(tryy,2);
							return url.replace('{z}','EPSG_'+zText+'_'+this.numberFix(z,2)).replace('{f}',file)
					  		  .replace('{x}',this.numberFix(x,4)).replace('{y}',this.numberFix(y,4));	
						}
						else if(z<18){ //12-17(文件夹3位，行列6位)
							var file = this.numberFix(tryx,3) + '_' + this.numberFix(tryy,3);
							return url.replace('{z}','EPSG_'+zText+'_'+this.numberFix(z,2)).replace('{f}',file)
					  		  .replace('{x}',this.numberFix(x,6)).replace('{y}',this.numberFix(y,6));
						}
						else{ //18级以上(文件夹4位，行列8位)
							var file = this.numberFix(tryx,4) + '_' + this.numberFix(tryy,4);
							return url.replace('{z}','EPSG_'+zText+'_'+this.numberFix(z,2)).replace('{f}',file)
					  		  .replace('{x}',this.numberFix(x,8)).replace('{y}',this.numberFix(y,8));
						}
    				} 
    			});
    			
    			return new ol.layer.Tile({
    				extent:extent,
    				source:source
    			});
    		},
    		
    		/**
    		 * TMS瓦片服务图层
    		 * @param baseUrl: 基地址,
    		 * @param {
    		 	  proj: 投影 e.g. default('EPSG:4326'),
    		 * 	  extent: 范围 e.g. default(proj.getExtent()),
    		 * 	  maxZoom: 最大层级 e.g. default(18),
    		 *    minZoom: 最小层级 e.g. default(0),
    		 *    tileSize: 瓦片大小 e.g. default([256,256]),
    		 * }
    		 */
    		tmsLayer: function(baseUrl,options){
    			if(!options) options = {};
    			var projText = options.proj?options.proj:'EPSG:4326';
    			var proj = ol.proj.get(projText);
    			var tileSize = options.tileSize?options.tileSize:[256,256]
    		    var resolutions = getResolutions({
    		    	proj: projText,
    		    	tileSize: tileSize,
    		    	arrayLength: 21
    		    });
    		    var worldExent = proj.getExtent();
    		    var suffix = baseUrl.split('@')[2];
    			return new ol.layer.Tile({
					extent: options.extent?options.extent:worldExent,
					source:new ol.source.XYZ({
						projection: proj,
						maxZoom: options.maxZoom?options.maxZoom:18,
						minZoom: options.minZoom?options.minZoom:0,
						tileGrid: new ol.tilegrid.TileGrid({
							extent: worldExent,
							origin: worldExent.getBottomLeft(),
							resolutions: resolutions,
							tileSize: tileSize
						}),
						tileUrlFunction: function(tileCoord){
							var z = tileCoord[0];
							var x = tileCoord[1];
							var y = tileCoord[2];
							return baseUrl+'/'+z+'/'+x+'/'+y+'.'+suffix;
						}
					})
				});
    		},
    		
    		/**
    		 * WMTS服务图层
    		 * @param baseUrl 基地址,
    		 * @param layerName 图层名,
    		 * @param {
    		 *	  proj: 投影 e.g. default('EPSG:4326'),
    		 * 	  extent: 范围 e.g. default(proj.getExtent()),
    		 *    style: 样式 e.g. default(''),
    		 *    format mime类型 e.g. default('image/png'),
    		 * 	  maxZoom: 最大层级 e.g. default(18),
    		 *    minZoom: 最小层级 e.g. default(0),
    		 *    dimensions: 尺寸(一般不用) e.g. default(undefined),
    		 *    tileSize: 瓦片大小 e.g. default([256,256]),
    		 * }
    		 * 
    		 */
    		wmtsLayer: function(baseUrl,layerName,options){
    			if(!options) options = {};
    			var projText = options.proj?options.proj:'EPSG:4326';
    			var proj = ol.proj.get(projText);
    			var tileSize = options.tileSize?options.tileSize:[256,256];
    		    var resolutions = getResolutions({
    		    	proj: projText,
    		    	tileSize: tileSize,
    		    	arrayLength: 21
    		    });
    		    var matrixIds = new Array(22);
    		    for(var i=0;i<22;i++) matrixIds[i] = i;
    		    var worldExent = proj.getExtent();
    		    var suffix = options.baseUrl.split('@')[2];
    		    var maxZoom = options.maxZoom?options.maxZoom:18;
    		    var minZoom = options.minZoom?options.minZoom:0;
    			return new ol.layer.Tile({
					extent: options.extent?options.extent:worldExent,
					minResolution: resolutions[maxZoom],
					maxResolution: resolutions[minZoom],
					source:new ol.source.WMTS({
						projection: proj,
						layer: layerName,
						style: options.style?options.style:'',
						format: options.format?options.format:'image/png',
						matrixSet: projText,
						dimensions: options.dimensions?options.dimensions:undefined,
						url: baseUrl,
						tileGrid: new ol.tilegrid.WMTS({
							extent: worldExent,
							origin: worldExent.getBottomLeft(),
							resolutions: resolutions,
							matrixIds: matrixIds,
							tileSize: tileSize
						})
					})
				});
    		}
    };
    
    return {
    	coordinate: coordinate,
    	base: base,
    	survey: survey,
    	geoserver: geoserver
    }
    
});


