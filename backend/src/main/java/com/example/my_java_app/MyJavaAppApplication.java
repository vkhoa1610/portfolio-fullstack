package com.example.my_java_app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class MyJavaAppApplication {

	public static void main(String[] args) {
		SpringApplication.run(MyJavaAppApplication.class, args);
	}

}
