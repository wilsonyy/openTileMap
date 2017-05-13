package com.wilson.tile.util;

import java.io.Serializable;
import java.util.LinkedHashMap;
import java.util.Map;

import com.jfinal.kit.JsonKit;


/**
 * 消息盒子
 * @author Wilson 2017/04/08
 */
public class MsgBox implements Serializable {
    private static final long serialVersionUID = -4564756642662000492L;
    
    public static final String SUCCESS = "SUCCESS";
    public static final String FAIL = "FAIL";

    private String code;    //结果代码，统一大写，如：SUCCESS
    private String msg;     //提示信息
    private Object data;         //返回的数据
    private Map<String, Object> map = new LinkedHashMap<>();
    
    /**
     * 构造消息盒子
     * @param code 状态
     * @param msg 返回信息
     * @param data 存储数据
     */
    public MsgBox(String code, String msg, Object data) {
        this.code = code;
        this.msg = msg;
        this.data = data;
        map.put("code", code);
        map.put("msg", msg);
        map.put("data", data);
    }
    

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getMsg() {
        return msg;
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }
    
    @SuppressWarnings("unchecked")
    public <T> T getData() {
        return (T) data;
    }

    public void setData(Object data) {
        this.data = data;
    }

    @Override
    public String toString() {
        return JsonKit.toJson(map);
    }
    
}
