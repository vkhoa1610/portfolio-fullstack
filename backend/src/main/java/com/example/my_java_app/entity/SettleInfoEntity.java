package com.example.my_java_app.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "SETTLE_INFO")
public class SettleInfoEntity {

    @Id
    private Long settleId;

    private String universityCode;
    private String examId;
    private Byte paymentType;

    private String admissionProcedure;
    private String admissionProcedure1;
    private String admissionProcedure2;
    private String admissionProcedure3;
    private String admissionProcedure4;
    private String admissionProcedure5;
    private String admissionProcedure6;
    private String admissionProcedure7;
    private String admissionProcedure8;
    private String admissionProcedure9;
    private String admissionProcedure10;

    private Byte status;
    private String transactionNo;
    private String remark;

    private String createUser;
    private String createTime;
    private String updateUser;
    private String updateTime;
    private Byte delFlg;
}
