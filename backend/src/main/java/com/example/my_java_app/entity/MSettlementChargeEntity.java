package com.example.my_java_app.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "M_SETTLEMENT_CHARGE")
public class MSettlementChargeEntity {

    @Id
    private Long settChargeId;

    private String universityCode;
    private Byte settType;
    private Double feeMin;
    private Double feeCharge;
    private Double feeAgency;
    private Byte status;
    private String remark;

    private String createUser;
    private String createTime;
    private String updateUser;
    private String updateTime;
    private Byte delFlg;
}
