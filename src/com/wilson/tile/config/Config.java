package com.wilson.tile.config;

import com.jfinal.config.*;
import com.jfinal.kit.PropKit;
import com.jfinal.plugin.activerecord.ActiveRecordPlugin;
import com.jfinal.plugin.activerecord.CaseInsensitiveContainerFactory;
import com.jfinal.plugin.activerecord.dialect.Sqlite3Dialect;
import com.jfinal.plugin.druid.DruidPlugin;
import com.jfinal.render.ViewType;
import com.jfinal.template.Engine;
import com.wilson.tile.controller.ComController;
import com.wilson.tile.controller.gis.MapController;
import com.wilson.tile.controller.index.IndexController;
import com.wilson.tile.controller.index.LoginController;
import com.wilson.tile.interceptor.PathInterceptor;
import com.wilson.tile.model.Account;


/**
 * JFinal配置
 * @author Wilson 2017/03/26
 * 
 */
public class Config  extends JFinalConfig {
	
	//配置常量
	public void configConstant(Constants me) {
		PropKit.use("config.properties");
		me.setDevMode(PropKit.getBoolean("mode_dev"));
		me.setViewType(ViewType.FREE_MARKER);
		
        me.setError403View("/WEB-INF/error/403.html");
        me.setError404View("/WEB-INF/error/404.html");
        me.setError500View("/WEB-INF/error/500.html");
	}
	
	//配置路由映射(非动态,需要自行增加)
	public void configRoute(Routes me) { 
		me.add("/com", ComController.class,"/WEB-INF/com");
		me.add("/", IndexController.class,"/WEB-INF/view/index");
		me.add("/login", LoginController.class,"/WEB-INF/view/index");
		me.add("/gis", MapController.class,"/WEB-INF/view/gis"); 
	}
	
	//配置模板引擎
	public void configEngine(Engine me) {
//		me.addSharedFunction("...html");
	}
	
	//配置插件
	public void configPlugin(Plugins me) {
		String jdbcUrl = PropKit.get("jdbcUrl");
		DruidPlugin dp = new DruidPlugin(jdbcUrl,null,null);
		dp.setInitialSize(PropKit.getInt("initialSize"));          //初始化连接数
        dp.setMaxActive(PropKit.getInt("maxActive"));          //最大连接数
        dp.setTimeBetweenEvictionRunsMillis(60000);     //空闲连接检测周期
		dp.setTestWhileIdle(true);                      //申请连接时检查超时的空闲连接
        dp.setValidationQuery("select 1");    //连接检查语句
        dp.setFilters("stat");     //监控统计：stat;
        
        ActiveRecordPlugin arp = new ActiveRecordPlugin(dp);
        arp.setContainerFactory(new CaseInsensitiveContainerFactory(true));          // 大小写不敏感，全部转换为小写
        arp.setDialect(new Sqlite3Dialect());                                      // Sqlite方言
        arp.setShowSql(PropKit.getBoolean("mode_sql"));                // 是否显示SQL语句
        
        //------------------------model配置-------------------------
        arp.addMapping("account","account_id", Account.class); 
        //------------------------model结束-------------------------
		me.add(dp);
		me.add(arp);
		
	}
	
	
	//配置拦截器
	public void configInterceptor(Interceptors me) {
		me.addGlobalActionInterceptor(new PathInterceptor());
//		me.add(new SessionInViewInterceptor(true));
	} 
	
	//配置处理器
	public void configHandler(Handlers me) {
		
	}
	
	//JFinal启动后
    @Override
    public void afterJFinalStart() {
        
    }
    
    //JFinal关闭前
	@Override
	public void beforeJFinalStop() {
		// TODO Auto-generated method stub
		super.beforeJFinalStop();
	}
    
    
}
