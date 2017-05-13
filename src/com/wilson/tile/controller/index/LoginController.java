package com.wilson.tile.controller.index;

import java.util.LinkedHashMap;
import java.util.Map;

import com.jfinal.core.Controller;
import com.wilson.tile.model.Account;
import com.wilson.tile.util.CryptoKit;
import com.wilson.tile.util.MsgBox;

/**
 * 登陆控制器
 * @author Wilson 2017/04/03
 *
 */
public class LoginController extends Controller{
	public void index() {
		String pubKey = getSessionAttr("rsa_public_key");
		setAttr("rsa_public_key",pubKey);
		renderFreeMarker("Login.html");
	}
	
	/**
	 * 登陆
	 * @throws Exception 
	 */
	public void login() throws Exception {
		String user = getPara("account");
		String password = getPara("password");
		String priKey = getSessionAttr("rsa_private_key");
		String key = new String(CryptoKit.decryptByPrivateKey(CryptoKit.decryptBASE64(password), priKey));
		String md5 = CryptoKit.encryptMD5(key.getBytes());
		Account account = Account.dao.findByAccount(user);
		if(account!=null){
			if(md5.equals(account.get("password"))){
				Map<String,Object> map = new LinkedHashMap<String,Object>();
				map.put("account", user);
				renderJson(new MsgBox("true", null, map));
				return;
			}else renderJson(new MsgBox("false", "密码错误", null));
		}else renderJson(new MsgBox("false", "账号不存在", null));
	}
}
