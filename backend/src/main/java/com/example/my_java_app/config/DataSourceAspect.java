package com.example.my_java_app.config;

import com.example.my_java_app.annotation.Write;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.DefaultTransactionDefinition;

import java.lang.reflect.Method;

@Slf4j
@Aspect
@Component
public class DataSourceAspect {

    private final PlatformTransactionManager txManager;

    private static final ThreadLocal<TransactionStatus> CURRENT_TX = new ThreadLocal<>();

    public DataSourceAspect(@Qualifier("transactionManager") PlatformTransactionManager txManager) {
        this.txManager = txManager;
    }

    // --------------------------------------------------------
    // CHECK IF CALL STACK CONTAINS @Write
    // --------------------------------------------------------
    private boolean isWriteCall() {
        StackTraceElement[] stack = Thread.currentThread().getStackTrace();

        try {
            for (StackTraceElement element : stack) {
                String cls = element.getClassName();
                if (!cls.startsWith("com.example")) continue;

                Class<?> clazz = Class.forName(cls);

                for (Method m : clazz.getDeclaredMethods()) {
                    if (m.getName().equals(element.getMethodName())
                        && m.isAnnotationPresent(Write.class)) {
                        return true;
                    }
                }
            }
        } catch (Exception ignored) {}

        return false;
    }

    // --------------------------------------------------------
    // AROUND REPOSITORY = QUYẾT ĐỊNH WRITE/READ + TRANSACTION
    // --------------------------------------------------------
    @Around("execution(* com.example.my_java_app.service..*(..))")
    public Object routeAndTx(ProceedingJoinPoint pjp) throws Throwable {

        boolean write = isWriteCall();

        if (!write) {
            // READ mode
            DataSourceContextHolder.set("READ");
            log.debug("ROUTING READ → {}", pjp.getSignature());
            try {
                return pjp.proceed();
            } finally {
                DataSourceContextHolder.clear();
            }
        }

        // -----------------------------
        // WRITE mode + transaction
        // -----------------------------
        DataSourceContextHolder.set("WRITE");
        log.debug("BEGIN WRITE TX → {}", pjp.getSignature());

        DefaultTransactionDefinition def = new DefaultTransactionDefinition();
        def.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRED);

        TransactionStatus status = txManager.getTransaction(def);
        CURRENT_TX.set(status);

        try {
            Object result = pjp.proceed();

            if (status.isRollbackOnly()) {
                log.info("TX rollbackOnly → rollback");
                txManager.rollback(status);
            } else {
                log.info("TX commit");
                txManager.commit(status);
            }

            return result;

        } catch (Throwable ex) {
            log.error("TX exception → rollback", ex);
            txManager.rollback(status);
            throw ex;

        } finally {
            CURRENT_TX.remove();
            DataSourceContextHolder.clear();
            log.debug("END WRITE TX → {}", pjp.getSignature());
        }
    }
}
