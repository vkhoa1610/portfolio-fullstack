package com.example.my_java_app.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "WALLET_INFO")
public class WalletInfoEntity {

    @Id
    private Long walletId;

    private Long settleId;
    private Byte paymentMethod;

    private Double totalFee;
    private Double feeMin;
    private Double feeCharge;
    private Double feeAgency;

    private String walletProvider;
    private String walletRequestTime;
    private String walletExpireTime;

    private String paymentResult;
    private String paymentInfo;
    private Byte status;

    private String createUser;
    private String createTime;
    private String updateUser;
    private String updateTime;
    private Byte delFlg;
}
