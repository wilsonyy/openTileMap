package com.wilson.tile.util;

import java.io.ByteArrayOutputStream;
import java.security.Key;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.HashMap;
import java.util.Map;

import javax.crypto.Cipher;

import org.apache.commons.codec.binary.Base64;

/**
 * 密文工具
 * @author Wilson 2017/04/01
 *
 */
public class CryptoKit {
	public static final String KEY_ALGORITHM = "RSA";  
    public static final String SIGNATURE_ALGORITHM = "MD5withRSA";  
    private static final String PUBLIC_KEY = "RSAPublicKey";  
    private static final String PRIVATE_KEY = "RSAPrivateKey";  
    private static final int MAX_ENCRYPT_BLOCK = 117; //RSA最大加密明文大小
    private static final int MAX_DECRYPT_BLOCK = 128; //RSA最大解密密文大小
    
    public static final String KEY_SHA = "SHA";  
    public static final String KEY_MD5 = "MD5";
	
	private CryptoKit(){}
	
    public static void main(String[] args) throws Exception{
    	Map<String, Object> keyPair =  initKey();
    	String privateKey = getPrivateKey(keyPair);
    	String publicKey = getPublicKey(keyPair);

    	System.err.println("公钥加密——私钥解密"); 
		String source = "这是一行没有任何意义的文字，你看完了等于没看，不是吗？"; 
		System.out.println("\r加密前文字：\r\n" + source); 
		byte[] data = source.getBytes(); 
		byte[] encodedData = encryptByPublicKey(data, publicKey);
		System.out.println("加密后文字：\r\n" + new String(encodedData));
		byte[] decodedData = decryptByPrivateKey(encodedData, privateKey);  
		System.out.println("解密后文字: \r\n" +  new String(decodedData));
		
		
		System.err.println("私钥加密——公钥解密"); 
		byte[] encodedDa = encryptByPrivateKey(data, privateKey); 
		System.out.println("加密后：\r\n" + new String(encodedDa)); 
		byte[] decodedDa = decryptByPublicKey(encodedDa, publicKey);
		System.out.println("解密后: \r\n" + new String(decodedDa)); 
		
		
		System.err.println("私钥签名——公钥验证签名"); 
		String sign = sign(encodedData, privateKey); 
		System.err.println("签名:\r" + sign); 
		boolean status = verify(encodedData, publicKey, sign); 
		System.err.println("验证结果:\r" + status);  
    }
    
    /** 
     * BASE64解密 
     *  
     * @param key 
     * @return 
     * @throws Exception 
     */  
    public static byte[] decryptBASE64(String key) {  
        return Base64.decodeBase64(key);
    }  
   
    /** 
     * BASE64加密 
     *  
     * @param key 
     * @return 
     * @throws Exception 
     */  
    public static String encryptBASE64(byte[] key) {  
        return Base64.encodeBase64String(key); 
    }  
   
    /** 
     * MD5加密 (信息摘要不可逆)
     *  
     * @param data 
     * @return 
     * @throws Exception 
     */  
    public static String encryptMD5(byte[] data) throws Exception {  
        MessageDigest md5 = MessageDigest.getInstance(KEY_MD5);
        //加密后的字符串
        return encryptBASE64(md5.digest(data)).toUpperCase();
    }  
   
    /** 
     * SHA加密
     *  
     * @param data 
     * @return 
     * @throws Exception 
     */  
    public static String encryptSHA(byte[] data) throws Exception {  
        MessageDigest sha = MessageDigest.getInstance(KEY_SHA);  
      //加密后的字符串
        return encryptBASE64(sha.digest(data)).toUpperCase();
    }  
    
    /** 
     * 用私钥对信息生成数字签名 
     *  
     * @param data 加密数据 
     * @param privateKey 私钥 
     * @return 
     * @throws Exception 
     */  
    public static String sign(byte[] data, String privateKey) throws Exception {  
        // 解密由base64编码的私钥  
        byte[] keyBytes = decryptBASE64(privateKey);  
   
        // 构造PKCS8EncodedKeySpec对象  
        PKCS8EncodedKeySpec pkcs8KeySpec = new PKCS8EncodedKeySpec(keyBytes);  
   
        // KEY_ALGORITHM 指定的加密算法  
        KeyFactory keyFactory = KeyFactory.getInstance(KEY_ALGORITHM);  
   
        // 取私钥匙对象  
        PrivateKey priKey = keyFactory.generatePrivate(pkcs8KeySpec);  
   
        // 用私钥对信息生成数字签名  
        Signature signature = Signature.getInstance(SIGNATURE_ALGORITHM);  
        signature.initSign(priKey);  
        signature.update(data);  
   
        return encryptBASE64(signature.sign());  
    }  
   
    /** 
     * 校验数字签名 
     *  
     * @param data 加密数据 
     * @param publicKey 公钥 
     * @param sign 数字签名
     * @return 校验成功返回true 失败返回false 
     * @throws Exception 
     */  
    public static boolean verify(byte[] data, String publicKey, String sign) throws Exception {  
   
        // 解密由base64编码的公钥  
        byte[] keyBytes = decryptBASE64(publicKey);  
   
        // 构造X509EncodedKeySpec对象  
        X509EncodedKeySpec keySpec = new X509EncodedKeySpec(keyBytes);  
   
        // KEY_ALGORITHM 指定的加密算法  
        KeyFactory keyFactory = KeyFactory.getInstance(KEY_ALGORITHM);  
   
        // 取公钥匙对象  
        PublicKey pubKey = keyFactory.generatePublic(keySpec);  
   
        Signature signature = Signature.getInstance(SIGNATURE_ALGORITHM);  
        signature.initVerify(pubKey);  
        signature.update(data);  
   
        // 验证签名是否正常  
        return signature.verify(decryptBASE64(sign));  
    }  
   
    /** 
     * 用私钥解密 
     * @param data 
     * @param key (BASE64) 
     * @return 
     * @throws Exception 
     */  
    public static byte[] decryptByPrivateKey(byte[] data, String key) throws Exception {      
        // 取得私钥  
    	byte[] keyBytes = decryptBASE64(key);
        PKCS8EncodedKeySpec pkcs8KeySpec = new PKCS8EncodedKeySpec(keyBytes);  
        KeyFactory keyFactory = KeyFactory.getInstance(KEY_ALGORITHM);  
        Key privateKey = keyFactory.generatePrivate(pkcs8KeySpec); 
        
    	// 对数据解密  
        Cipher cipher = Cipher.getInstance(keyFactory.getAlgorithm());  
        cipher.init(Cipher.DECRYPT_MODE, privateKey);  
        
        int inputLen = data.length;
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        int offSet = 0;
        byte[] cache;
        int i = 0;
        // 对数据分段解密
        while (inputLen - offSet > 0) {
            if (inputLen - offSet > MAX_DECRYPT_BLOCK) cache = cipher.doFinal(data, offSet, MAX_DECRYPT_BLOCK);
            else cache = cipher.doFinal(data, offSet, inputLen - offSet);
            out.write(cache, 0, cache.length);
            i++;
            offSet = i * MAX_DECRYPT_BLOCK;
        }
        byte[] decryptedData = out.toByteArray();
        out.close();
        return decryptedData;
    }  
   
    /** 
     * 用公钥解密 
     * @param data 
     * @param key (BASE64)
     * @return 
     * @throws Exception 
     */  
    public static byte[] decryptByPublicKey(byte[] data, String key) throws Exception {  
        // 取得公钥  
    	byte[] keyBytes = decryptBASE64(key);
        X509EncodedKeySpec x509KeySpec = new X509EncodedKeySpec(keyBytes);  
        KeyFactory keyFactory = KeyFactory.getInstance(KEY_ALGORITHM);  
        Key publicKey = keyFactory.generatePublic(x509KeySpec);  
   
        // 对数据解密  
        Cipher cipher = Cipher.getInstance(keyFactory.getAlgorithm());  
        cipher.init(Cipher.DECRYPT_MODE, publicKey);  
        
        int inputLen = data.length;
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        int offSet = 0;
        byte[] cache;
        int i = 0;
        // 对数据分段解密
        while (inputLen - offSet > 0) {
            if (inputLen - offSet > MAX_DECRYPT_BLOCK) {
                cache = cipher.doFinal(data, offSet, MAX_DECRYPT_BLOCK);
            } else {
                cache = cipher.doFinal(data, offSet, inputLen - offSet);
            }
            out.write(cache, 0, cache.length);
            i++;
            offSet = i * MAX_DECRYPT_BLOCK;
        }
        byte[] decryptedData = out.toByteArray();
        out.close();
        return decryptedData;
    }  
   
    /** 
     * 用公钥加密 
     *  
     * @param data 
     * @param key (BASE64)
     * @return 
     * @throws Exception 
     */  
    public static byte[] encryptByPublicKey(byte[] data, String key) throws Exception {  
        // 对公钥解密  
        byte[] keyBytes = decryptBASE64(key);  
   
        // 取得公钥  
        X509EncodedKeySpec x509KeySpec = new X509EncodedKeySpec(keyBytes);  
        KeyFactory keyFactory = KeyFactory.getInstance(KEY_ALGORITHM);  
        Key publicKey = keyFactory.generatePublic(x509KeySpec);  
   
        // 对数据加密  
        Cipher cipher = Cipher.getInstance(keyFactory.getAlgorithm());  
        cipher.init(Cipher.ENCRYPT_MODE, publicKey);
        int inputLen = data.length;
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        int offSet = 0;
        byte[] cache;
        int i = 0;
        // 对数据分段加密
        while (inputLen - offSet > 0) {
            if (inputLen - offSet > MAX_ENCRYPT_BLOCK) cache = cipher.doFinal(data, offSet, MAX_ENCRYPT_BLOCK);
            else cache = cipher.doFinal(data, offSet, inputLen - offSet);
            out.write(cache, 0, cache.length);
            i++;
            offSet = i * MAX_ENCRYPT_BLOCK;
        }
        byte[] encryptedData = out.toByteArray();
        out.close();
        return encryptedData;
    }  
   
    /** 
     * 用私钥加密 
     *  
     * @param data 
     * @param key (BASE64)
     * @return 
     * @throws Exception 
     */  
    public static byte[] encryptByPrivateKey(byte[] data, String key) throws Exception {  
        // 对密钥解密  
        byte[] keyBytes = decryptBASE64(key);  
   
        // 取得私钥  
        PKCS8EncodedKeySpec pkcs8KeySpec = new PKCS8EncodedKeySpec(keyBytes);  
        KeyFactory keyFactory = KeyFactory.getInstance(KEY_ALGORITHM);  
        Key privateKey = keyFactory.generatePrivate(pkcs8KeySpec);  
   
        // 对数据加密  
        Cipher cipher = Cipher.getInstance(keyFactory.getAlgorithm());  
        cipher.init(Cipher.ENCRYPT_MODE, privateKey);  

        return cipher.doFinal(data);  
    }  
   
    /** 
     * 取得私钥 
     *  
     * @param keyMap 
     * @return 
     * @throws Exception 
     */  
    public static String getPrivateKey(Map<String, Object> keyMap) throws Exception {  
    	RSAPrivateKey key = (RSAPrivateKey) keyMap.get(PRIVATE_KEY);
        return encryptBASE64(key.getEncoded());  
    }  
   
    /** 
     * 取得公钥 
     *  
     * @param keyMap 
     * @return 
     * @throws Exception 
     */  
    public static String getPublicKey(Map<String, Object> keyMap) throws Exception {  
    	RSAPublicKey key = (RSAPublicKey) keyMap.get(PUBLIC_KEY);  
        return encryptBASE64(key.getEncoded());  
    }  
   
    /** 
     * 初始化密钥对 
     *  
     * @return 
     * @throws Exception 
     */  
    public static Map<String, Object> initKey() throws Exception {  
        KeyPairGenerator keyPairGen = KeyPairGenerator.getInstance(KEY_ALGORITHM);  
        keyPairGen.initialize(1024);  
   
        KeyPair keyPair = keyPairGen.generateKeyPair();  
   
        // 公钥  
        RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();  
   
        // 私钥  
        RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();  
   
        Map<String, Object> keyMap = new HashMap<String, Object>(2);  
   
        keyMap.put(PUBLIC_KEY, publicKey);  
        keyMap.put(PRIVATE_KEY, privateKey);  
        return keyMap;  
    } 
}
