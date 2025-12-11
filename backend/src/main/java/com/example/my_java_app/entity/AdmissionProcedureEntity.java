package com.example.my_java_app.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "ADMISSION_PROCEDURE")
public class AdmissionProcedureEntity {

    @Id
    private Long idAdmissionProcedure;

    private String universityCode;

    private Double entranceFee;
    private Double entranceFee2;

    private Long destinationAdmissionProcedureId;

    private String createUser;
    private String createTime;
    private String updateUser;
    private String updateTime;
    private Byte delFlg;
}
