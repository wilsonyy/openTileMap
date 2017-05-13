package com.wilson.tile.model;

import com.jfinal.plugin.activerecord.Model;

/**
 * 账号模型
 * @author Wilson 2017/04/06
 *
 */
public class Account extends Model<Account>{
	public static Account dao = new Account().dao();
	private static final long serialVersionUID = 6909205858218738869L;
	
	/**
	 * 按账号查找记录
	 * @param account 登录账号
	 * @return
	 */
	public Account findByAccount(String account){
		return findFirst("SELECT * FROM account WHERE account = ?", account);
	}
}
