package com.wilson.tile.listener;

import java.util.Map;

import javax.servlet.http.HttpSessionEvent;
import javax.servlet.http.HttpSessionListener;

import org.apache.log4j.Logger;

import com.wilson.tile.util.CryptoKit;

/**
 * 会话监听器
 * @author Wilson 2016/04/02
 *
 */
public class SessionListener implements  HttpSessionListener{
	private static final Logger logger = Logger.getLogger(SessionListener.class);
	    
    @Override
    public void sessionCreated(HttpSessionEvent hse) {
        try {
            Map<String,Object> keyPair = CryptoKit.initKey();
            hse.getSession().setAttribute("rsa_public_key", CryptoKit.getPublicKey(keyPair));
            hse.getSession().setAttribute("rsa_private_key", CryptoKit.getPrivateKey(keyPair));
        } catch (Exception e) {
            logger.error(e);
        }
    }

    @Override
    public void sessionDestroyed(HttpSessionEvent hse) {
        
    }
}
