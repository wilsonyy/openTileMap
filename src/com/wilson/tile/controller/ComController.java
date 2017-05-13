package com.wilson.tile.controller;

import com.jfinal.core.Controller;

public class ComController extends Controller{
	/**
     * 页面JS注入ContextPath
     */
//    @Clear(AuthAOP.class)
    public void base() {
        renderFreeMarker("Base.html");
    }
    
    /**
     * 页面JS加载Loading
     */
    public void loading() {
        renderFreeMarker("Loading.html");
    }
}
