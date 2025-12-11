package com.example.my_java_app.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "M_SETTLEMENT")
public class MSettlementEntity {

    @Id
    private Long settId;

    private String universityCode;
    private String walletParameter;
    private Byte settType;
    private String businessCode;
    private String gymCode;
    private String settlementId;
    private String settlementPassword;
    private Byte status;
    private String remark;

    private String createUser;
    private String createTime;
    private String updateUser;
    private String updateTime;
    private Byte delFlg;
}
