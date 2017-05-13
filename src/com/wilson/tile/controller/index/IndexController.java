package com.wilson.tile.controller.index;

import com.jfinal.core.Controller;

/**
 * 起始页控制器
 * @author Wilson 2017/04/10
 *
 */
public class IndexController extends Controller{
	public void index(){
		renderFreeMarker("Index.html");
	}
}
