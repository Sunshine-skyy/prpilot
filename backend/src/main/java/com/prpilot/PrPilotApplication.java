package com.prpilot;

import com.prpilot.config.LlmProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(LlmProperties.class)
public class PrPilotApplication {

    public static void main(String[] args) {
        SpringApplication.run(PrPilotApplication.class, args);
    }
}
