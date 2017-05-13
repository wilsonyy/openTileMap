package com.wilson.tile.controller.gis;

import java.util.List;

import com.jfinal.core.Controller;
import com.jfinal.kit.StrKit;
import com.jfinal.plugin.activerecord.Db;
import com.jfinal.plugin.activerecord.Record;

public class MapController extends Controller{
	public void index(){
		renderFreeMarker("Map.html");
	}
	
	public void dynimicGetLayer(){
		String pid = getPara("pid");
		StringBuilder sql = new StringBuilder();
		sql.append("SELECT * FROM ( ");
		sql.append("SELECT map_site_id id,null pid,name,null url FROM map_site ");
		sql.append("UNION ALL ");
		sql.append("SELECT wms_id id,map_site_id pid,layer name,wms_url url FROM wms_url)mvp ");
		List<Record> list = null;
		if(StrKit.notBlank(pid)){
			sql.append("WHERE pid = ?");
			list = Db.find(sql.toString(),pid);
		}
		else{
			sql.append("WHERE pid is null");
			list = Db.find(sql.toString());
		}
		renderJson(list);
	}
}