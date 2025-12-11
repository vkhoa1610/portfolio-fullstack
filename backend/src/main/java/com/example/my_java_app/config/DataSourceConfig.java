package com.example.my_java_app.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;
import lombok.extern.slf4j.Slf4j;
import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Configuration
public class DataSourceConfig {

    // ============================================================
    // 1) CLASS ROUTING DATASOURCE (gộp từ file số 2)
    // ============================================================

    public static class RoutingDataSource extends AbstractRoutingDataSource {

        @Override
        protected Object determineCurrentLookupKey() {
            String key = DataSourceContextHolder.get();
            log.info("🔍 ROUTING DATASOURCE = {}", key);
            return key;
        }
    }

    // ============================================================
    // 2) PROPERTIES
    // ============================================================

    @Bean("writeProperties")
    @org.springframework.boot.context.properties.ConfigurationProperties("spring.datasource.write")
    public DataSourceProperties writeDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean("readProperties")
    @org.springframework.boot.context.properties.ConfigurationProperties("spring.datasource.read")
    public DataSourceProperties readDataSourceProperties() {
        return new DataSourceProperties();
    }

    // ============================================================
    // 3) DATASOURCE (HIKARI)
    // ============================================================

    @Bean("writeDataSource")
    public DataSource writeDataSource(
            @Qualifier("writeProperties") DataSourceProperties properties) {

        return properties
                .initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
    }

    @Bean("readDataSource")
    public DataSource readDataSource(
            @Qualifier("readProperties") DataSourceProperties properties) {

        return properties
                .initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
    }

    // ============================================================
    // 4) ROUTING DATASOURCE (đã include RoutingDataSource bên trên)
    // ============================================================

    @Bean("routingDataSource")
    @Primary
    public DataSource routingDataSource(
            @Qualifier("writeDataSource") DataSource write,
            @Qualifier("readDataSource") DataSource read) {

        RoutingDataSource routing = new RoutingDataSource();

        Map<Object, Object> map = new HashMap<>();
        map.put("WRITE", write);
        map.put("READ", read);

        routing.setTargetDataSources(map);
        routing.setDefaultTargetDataSource(read);

        return routing;
    }

    // ============================================================
    // 5) TRANSACTION MANAGER
    // ============================================================

    @Bean("transactionManager")
    public DataSourceTransactionManager transactionManager(
            @Qualifier("routingDataSource") DataSource routingDataSource) {

        return new DataSourceTransactionManager(routingDataSource);
    }
}
