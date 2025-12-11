package com.example.my_java_app.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "ADMISSION_PROCEDURE_ANYAMOUNT")
public class AdmissionProcedureAnyAmountEntity {

    @Id
    private Long idAdmissionProcedure;

    private String universityCode;
    private Double entranceFee;

    private String createUser;
    private String createTime;
    private String updateUser;
    private String updateTime;
    private Byte delFlg;
}
