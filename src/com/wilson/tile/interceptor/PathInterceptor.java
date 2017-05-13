package com.wilson.tile.interceptor;

import javax.servlet.http.HttpServletRequest;

import com.jfinal.aop.Interceptor;
import com.jfinal.aop.Invocation;

/**
 * 路径拦截器
 * @author Wilson 2017/03/26
 *
 */
public class PathInterceptor implements Interceptor {

	@Override
	public void intercept(Invocation arg0) {
		arg0.getController().getSession();//JFinal BUG，只有调用getSession()后才会生成session
        HttpServletRequest request = arg0.getController().getRequest();
        arg0.getController().setAttr("base", request.getContextPath());
        arg0.invoke(); 
	}

}
