package com.example.my_java_app.config;

public class DataSourceContextHolder {

    private static final ThreadLocal<String> DATASOURCE_TYPE = new ThreadLocal<>();

    public static void set(String type) {
        DATASOURCE_TYPE.set(type);
    }

    public static String get() {
        String type = DATASOURCE_TYPE.get();
        return (type != null) ? type : "READ";
    }

    public static void clear() {
        DATASOURCE_TYPE.remove();
    }
}
